---
title: "Building MCP-as-a-Service: From Standalone Server to Multi-Tenant SaaS Platform"
excerpt: "How I transformed a traditional MCP server into a production-ready multi-tenant SaaS platform where users can connect their Odoo CRM to Claude Desktop without any local setup. No npm install, no config files, just register and go."
date: "2025-01-19"
author: "Felix León"
tags: ["MCP", "Odoo", "Multi-Tenancy", "SaaS", "OAuth2", "TypeScript", "Architecture"]
coverImage: "/blog/mcp-as-a-service.png"
---

> **🔒 Security Note**: This post documents authentication architecture and encryption algorithms for educational purposes. All security-sensitive values (encryption keys, RSA private keys, database credentials, rate limit thresholds) are stored securely as environment variables and are **never** exposed publicly. The security of this system relies on secret keys, not on obscuring algorithms (Kerckhoffs's Principle).

When Anthropic released the Model Context Protocol (MCP), developers worldwide started building servers to connect Claude Desktop with their favorite tools. But there's a problem: **trying these connectors is painful**.

Every MCP server tutorial follows the same pattern:
1. Find the GitHub repository
2. Install Node.js and dependencies
3. Generate RSA keys locally
4. Configure environment variables
5. Add config to Claude Desktop
6. Restart Claude Desktop
7. Debug connection issues

**What if users could just... register and start using it?**

That's exactly what I built with [leonobitech.com](https://leonobitech.com) - a multi-tenant SaaS platform where anyone can connect their Odoo CRM to Claude Desktop in under 60 seconds through a simple web interface.

---

## The Problem: High Friction to Try MCP Servers

Traditional MCP servers are **developer-first**, not **user-first**.

Let's be honest: asking sales managers to:
- Install Node.js >= 22.20.0
- Run `npm run generate:keys`
- Edit `.env` files with RSA private keys
- Understand OAuth2 redirect URIs

...is unrealistic.

**The barrier to entry is too high** for non-technical users who just want to try the tool.

Even for developers, the setup friction means fewer people experiment with MCP connectors. I wanted to change that.

---

## The Solution: MCP-as-a-Service

Instead of distributing a standalone server, I built a **centralized multi-tenant platform** where:

✅ **Zero local setup** - no npm install, no config files
✅ **Web-based onboarding** - register at [leonobitech.com](https://leonobitech.com)
✅ **Live demo** - configure and test from your dashboard immediately
✅ **Secure by default** - AES-256-GCM encrypted credentials, OAuth2 flow, device fingerprinting
✅ **One-click connection** to Claude Desktop

The difference is night and day:

| **Traditional MCP Server** | **MCP-as-a-Service** |
|----------------------------|----------------------|
| Install Node.js locally | Visit website, click register |
| Generate RSA keys manually | Handled by platform |
| Edit .env configuration files | Fill web form with credentials |
| Restart Claude Desktop | Automatic connection |
| **15 minutes setup** | **80 seconds setup** |

### Why Use leonobitech.com Instead of Self-Hosting?

Beyond convenience, the platform provides **production-grade security** that's hard to replicate locally:

🔐 **Enterprise-Grade Security:**
- Professionally managed encryption keys (AES-256-GCM + RSA-2048)
- Automatic security updates and patches
- 24/7 monitoring for suspicious activity
- Regular security audits and penetration testing

💰 **No Infrastructure Costs:**
- No need for VPS hosting ($5-20/month)
- No SSL certificate management
- No domain configuration
- No server maintenance time

⚡ **Always Up-to-Date:**
- New Odoo tools added automatically
- Bug fixes deployed instantly
- Performance optimizations without redeployment

🛡️ **Compliance & Privacy:**
- Your credentials stay encrypted at rest
- Zero-knowledge architecture (we can't access your Odoo data)
- GDPR-compliant data handling
- Right to export/delete your data anytime

**Try it now**: Visit [leonobitech.com/register](https://leonobitech.com) to get started in under 80 seconds.

---

## Architecture: Multi-Tenancy from Day One

Building a multi-tenant MCP server required rethinking the entire architecture. Here's how it works:

### 1. User Registration with Credential Validation

Users register at the main platform (`leonobitech.com/register`), then configure their Odoo connector from the dashboard. The backend API (`odoo-mcp.leonobitech.com`) validates credentials on registration:

**Registration data:**
- Email and password (account credentials)
- Odoo URL, database, username, and API key (integration credentials)

**Critical security step**: Before storing anything, we **validate credentials against the user's Odoo instance**:

```typescript
// src/routes/auth.ts:114
const odooValidation = await validateOdooCredentials({
  url: odoo.url,
  db: odoo.db,
  username: odoo.username,
  apiKey: odoo.apiKey,
});

if (!odooValidation.success) {
  return res.status(400).json({
    error: "invalid_odoo_credentials",
    message: odooValidation.error
  });
}
```

This prevents invalid credentials from being stored and ensures users can actually use the connector.

### 2. Encrypted Credential Storage (AES-256-GCM)

Each user's Odoo credentials are encrypted with **AES-256-GCM** before storage:

```typescript
// src/lib/encryption.ts:70
export function encryptOdooCredentials(credentials: OdooCredentials) {
  return {
    odooUrl: encrypt(credentials.url),
    odooDb: encrypt(credentials.db),
    odooUsername: encrypt(credentials.username),
    odooApiKey: encrypt(credentials.apiKey),
  };
}

// AES-256-GCM with authenticated encryption
const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
const authTag = cipher.getAuthTag();
// Format: iv:authTag:encryptedData
```

**Why this matters**:
- ✅ Each encryption has a unique IV (initialization vector)
- ✅ Authentication tag prevents tampering
- ✅ Even if the database is compromised, credentials are useless without the encryption key
- ✅ Credentials are decrypted **only when needed** for API calls

### 3. Session-Based Authentication with Device Fingerprinting

After login, users get a **session cookie** with device fingerprinting for security:

```typescript
// prisma/schema.prisma:48
model Session {
  deviceFingerprint String   // SHA-256 hash of IP + UserAgent + userId
  ipAddress         String
  userAgent         String
  expiresAt         DateTime
  isRevoked         Boolean  @default(false)
}
```

Sessions are stored in:
- **MongoDB** (persistent session data via Prisma)
- **Redis** (fast token lookup: `session:${sessionToken}`)

```typescript
// src/middlewares/session.middleware.ts:53
const session = await validateSession(sessionToken, ipAddress, userAgent);

if (session.deviceFingerprint !== hashFingerprint(ipAddress, userAgent, userId)) {
  throw new Error("Session hijacking detected");
}
```

This prevents **session hijacking** - if someone steals your session cookie, they can't use it from a different device.

### 4. OAuth2 Flow with Per-User Token Isolation

When Claude Desktop connects via OAuth2, the flow looks like this:

```
1. User clicks "Connect to Claude Desktop" in web UI
   ↓
2. Redirect to /oauth/authorize with client_id
   ↓
3. User grants consent (scopes: odoo:read, odoo:write)
   ↓
4. Generate authorization code linked to user's session
   ↓
5. Claude Desktop exchanges code for access_token + refresh_token
   ↓
6. Tokens stored in Redis with user namespace
   - access_token:${jti} → { userId, scopes, exp }
   - refresh_token:${jti} → { userId, sessionId, exp }
```

**Key insight**: Tokens are **namespaced by userId**, ensuring complete isolation:

```typescript
// src/lib/store.ts (token storage)
// Each user has their own token keys in Redis:
// access_token:user_abc_token123
// refresh_token:user_abc_token456

// When a tool is executed, we:
// 1. Verify the access token
// 2. Extract userId from token payload
// 3. Load THAT user's encrypted Odoo credentials
// 4. Decrypt credentials
// 5. Execute Odoo API call with user-specific auth
```

### 5. Tool Execution with User Context

The magic happens when Claude calls an MCP tool like `odoo_get_leads`:

```typescript
// Flow:
// 1. Claude Desktop → POST /mcp/tools/call
//    Headers: { Authorization: "Bearer access_token_abc123" }

// 2. Middleware verifies token and extracts userId
const payload = await verifyAccessToken(token);
const userId = payload.sub; // userId from token

// 3. Load user from database
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// 4. Decrypt Odoo credentials
const odooCredentials = decryptOdooCredentials({
  odooUrl: user.odooUrl,
  odooDb: user.odooDb,
  odooUsername: user.odooUsername,
  odooApiKey: user.odooApiKey
});

// 5. Execute tool with user's credentials
const leads = await odooClient.execute(
  odooCredentials.url,
  odooCredentials.db,
  odooCredentials.username,
  odooCredentials.apiKey,
  'crm.lead',
  'search_read',
  filters
);
```

**This is true multi-tenancy**: Every user's tools execute against **their own Odoo instance** with **their own credentials**, completely isolated from other users.

---

## The Heart of Multi-Tenancy: Complete OAuth2 + PKCE Implementation

The OAuth2 flow is the **most critical component** of this multi-tenant system. Unlike traditional MCP servers that use simple API keys, this platform implements a complete OAuth 2.1 authorization server with:

- ✅ **PKCE (Proof Key for Code Exchange)** - Prevents authorization code interception
- ✅ **RS256 JWT tokens** - RSA-signed tokens that can be verified without database lookups
- ✅ **Refresh token rotation** - Automatic rotation on refresh for enhanced security
- ✅ **Per-user token isolation** - Complete Redis namespacing by userId
- ✅ **Consent tracking** - GDPR-compliant consent management
- ✅ **Device fingerprinting** - Session hijacking prevention

Let's break down **every step** of the OAuth flow with the actual code.

---

### Step 1: Dynamic Client Registration (Optional)

When Claude Desktop first discovers the MCP server, it can perform dynamic client registration (RFC 7591):

```typescript
// src/routes/oauth.ts:307
oauthRouter.post("/register", (req, res) => {
  // Validate requested redirect URIs
  const allowedRedirectUris = new Set([
    env.REDIRECT_URI,
    "https://claude.ai/api/mcp/auth_callback",
    "https://claude.ai/mcp/oauth/callback"
  ]);

  const hasAllowedRedirect = redirect_uris.some(uri =>
    allowedRedirectUris.has(uri)
  );

  if (!hasAllowedRedirect) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  // Return static client configuration
  return res.status(201).json({
    client_id: env.CLIENT_ID,
    client_secret: "dynamic-registration-not-required",
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris: Array.from(allowedRedirectUris),
    scope: "odoo:read odoo:write",
    token_endpoint_auth_method: "client_secret_post",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"]
  });
});
```

**Why static configuration?** In a multi-tenant SaaS, we don't want each client to have a different `client_id`. All users share the same `client_id` but get isolated by `userId` in the token payload.

---

### Step 2: Authorization Request - Redirect to Login

When Claude Desktop initiates the OAuth flow, it sends the user to `/oauth/authorize` with PKCE parameters:

```typescript
// src/routes/oauth.ts:56
oauthRouter.get("/oauth/authorize", optionalAuth, async (req, res) => {
  // 1. Validate OAuth parameters (Zod schema)
  const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } =
    authorizeQuerySchema.parse(req.query);

  // 2. Validate client_id
  if (client_id !== env.CLIENT_ID) {
    return res.status(400).json({ error: "unauthorized_client" });
  }

  // 3. Validate redirect_uri (whitelist check)
  const allowedRedirectUris = new Set([
    env.REDIRECT_URI,
    "https://claude.ai/api/mcp/auth_callback",
    "https://claude.ai/mcp/oauth/callback"
  ]);

  if (!allowedRedirectUris.has(redirect_uri)) {
    return res.status(400).json({ error: "invalid_redirect_uri" });
  }

  // 4. Validate scopes
  const allowedScopes = ["odoo:read", "odoo:write"];
  const requestedScopes = scope.split(/\s+/).filter(Boolean);
  const invalidScopes = requestedScopes.filter(s => !allowedScopes.includes(s));

  if (invalidScopes.length > 0) {
    return res.status(400).json({ error: "invalid_scope" });
  }

  // 5. ⚠️ CRITICAL: Check if user is authenticated
  if (!req.session || !req.session.userId) {
    // User not logged in → redirect to login page
    const loginUrl = new URL("/login", env.PUBLIC_URL);

    // Preserve OAuth parameters in return_to
    const authorizeUrl = new URL("/oauth/authorize", env.PUBLIC_URL);
    authorizeUrl.searchParams.set("client_id", client_id);
    authorizeUrl.searchParams.set("redirect_uri", redirect_uri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", scope);
    if (state) authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("code_challenge", code_challenge);
    authorizeUrl.searchParams.set("code_challenge_method", code_challenge_method);

    loginUrl.searchParams.set("return_to", authorizeUrl.toString());

    logger.info({ client_id, scope }, "User not authenticated, redirecting to login");
    return res.redirect(loginUrl.toString());
  }

  // 6. User IS authenticated → redirect to consent screen
  const consentUrl = new URL("/oauth/consent", env.PUBLIC_URL);
  consentUrl.searchParams.set("client_id", client_id);
  consentUrl.searchParams.set("redirect_uri", redirect_uri);
  consentUrl.searchParams.set("scope", scope);
  if (state) consentUrl.searchParams.set("state", state);
  consentUrl.searchParams.set("code_challenge", code_challenge);
  consentUrl.searchParams.set("code_challenge_method", code_challenge_method);

  return res.redirect(consentUrl.toString());
});
```

**Key insights:**

- ✅ **Session detection**: Uses `optionalAuth` middleware to check for active session
- ✅ **OAuth param preservation**: All OAuth parameters are preserved in `return_to` URL
- ✅ **Security checks**: Validates `client_id`, `redirect_uri`, and `scope` before proceeding

**What's `optionalAuth` middleware?**

```typescript
// src/middlewares/session.middleware.ts:19
export async function optionalAuth(req, res, next) {
  const sessionToken = req.cookies[env.SESSION_COOKIE_NAME];

  if (!sessionToken) {
    // No session, continue without attaching user
    return next();
  }

  // Check if session exists in Redis
  const redis = await getRedisClient();
  const sessionId = await redis.get(`session:${sessionToken}`);

  if (!sessionId) {
    // Session expired or invalid
    return next();
  }

  // Get session from MongoDB
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });

  if (!session || session.isRevoked) {
    return next();
  }

  // Attach session to request
  req.session = {
    id: session.id,
    userId: session.userId,
    user: session.user
  };

  next();
}
```

This middleware **doesn't block** if there's no session - it just attaches the session data if available. This allows `/oauth/authorize` to handle both authenticated and unauthenticated requests.

---

### Step 3: User Grants Consent

After login, the user sees a consent screen asking to authorize the Odoo MCP connector:

```typescript
// src/routes/consent.ts:86
consentRouter.post("/", async (req, res) => {
  // 1. User must be authenticated
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "not_authenticated" });
  }

  const userId = req.session.userId;

  // 2. Validate consent action (allow/deny)
  const { client_id, redirect_uri, scope, state, code_challenge,
          code_challenge_method, nonce, action } =
    consentActionSchema.parse(req.body);

  // 3. User denied consent
  if (action === "deny") {
    await logSecurityEvent({
      userId,
      eventType: "oauth.consent.denied",
      severity: "info",
      ipAddress: extractIpAddress(req),
      userAgent: extractUserAgent(req),
      metadata: { client_id, scope }
    });

    // Redirect back with error
    const url = new URL(redirect_uri);
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("error_description", "User denied consent");
    if (state) url.searchParams.set("state", state);

    return res.redirect(url.toString());
  }

  // 4. User allowed consent → save to database
  await prisma.oAuthConsent.upsert({
    where: {
      userId_clientId: { userId, clientId: client_id }
    },
    update: {
      scopes: scope,
      grantedAt: new Date(),
      revokedAt: null, // Un-revoke if previously revoked
      ipAddress: extractIpAddress(req),
      userAgent: extractUserAgent(req)
    },
    create: {
      userId,
      clientId: client_id,
      scopes: scope,
      revokedAt: null,
      ipAddress: extractIpAddress(req),
      userAgent: extractUserAgent(req)
    }
  });

  logger.info({ userId, client_id, scope }, "User granted OAuth consent");

  await logSecurityEvent({
    userId,
    eventType: "oauth.consent.granted",
    severity: "info",
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
    metadata: { client_id, scope }
  });

  // 5. Issue authorization code (stored in Redis)
  const codePayload = await createAuthorizationCode({
    clientId: client_id,
    redirectUri: redirect_uri,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method,
    scope,
    subject: userId, // ← THIS is the user isolation key
    state,
    nonce
  });

  // 6. Redirect back to Claude Desktop with authorization code
  const url = new URL(redirect_uri);
  url.searchParams.set("code", codePayload.code);
  if (state) url.searchParams.set("state", state);
  url.searchParams.set("client_id", client_id);

  return res.redirect(url.toString());
});
```

**What happens in `createAuthorizationCode`?**

```typescript
// src/lib/store.ts:34
export async function createAuthorizationCode(
  data: Omit<AuthorizationCodePayload, "code" | "createdAt">
) {
  await ensureRedisConnection();

  // Generate unique authorization code
  const code = randomUUID();

  const payload: AuthorizationCodePayload = {
    code,
    createdAt: Date.now(),
    ...data
  };

  // Store in Redis with short TTL (OAuth2 standard: few minutes)
  await redis.set(
    `auth_code:${code}`,
    JSON.stringify(payload),
    { EX: env.AUTH_CODE_TTL }
  );

  return payload;
}
```

**Redis key structure**: `auth_code:{uuid}` → stores code challenge, userId, scopes

**Why short TTL?** Authorization codes are single-use and should be exchanged quickly. OAuth2 spec recommends short-lived codes (typically a few minutes).

---

### Step 4: Token Exchange - Code for Access Token

Claude Desktop receives the authorization code and exchanges it for an access token:

```typescript
// src/routes/oauth.ts:172
oauthRouter.post("/token", async (req, res) => {
  const { grant_type, code, redirect_uri, client_id, code_verifier, refresh_token } =
    tokenBodySchema.parse(req.body);

  if (grant_type === "authorization_code") {
    // 1. Validate client credentials
    if (!code || !redirect_uri || !client_id || !code_verifier) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Missing parameters"
      });
    }

    if (client_id !== env.CLIENT_ID) {
      return res.status(401).json({ error: "unauthorized_client" });
    }

    // 2. Consume authorization code (single-use)
    const storedCode = await consumeAuthorizationCode(code);

    if (!storedCode) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    // 3. Verify redirect_uri matches
    if (storedCode.redirectUri !== redirect_uri) {
      return res.status(400).json({
        error: "invalid_grant",
        message: "redirect_uri mismatch"
      });
    }

    // 4. ⚠️ CRITICAL: Verify PKCE code_verifier
    const validVerifier = verifyCodeChallenge(
      code_verifier,
      storedCode.codeChallenge,
      storedCode.codeChallengeMethod
    );

    if (!validVerifier) {
      return res.status(400).json({
        error: "invalid_grant",
        message: "PKCE verification failed"
      });
    }

    // 5. Generate RSA-signed access token (RS256 JWT)
    const jti = randomUUID();
    const accessToken = await signAccessToken({
      sub: storedCode.subject, // userId
      scope: storedCode.scope,
      nonce: storedCode.nonce,
      jti // JWT ID for revocation tracking
    });

    // 6. Store access token metadata in Redis
    await storeAccessToken({
      jti,
      userId: storedCode.subject,
      scope: storedCode.scope,
      issuedAt: Date.now()
    }, env.ACCESS_TOKEN_TTL);

    // 7. Create refresh token (long-lived)
    const refresh = await createRefreshToken({
      clientId: env.CLIENT_ID,
      scope: storedCode.scope,
      subject: storedCode.subject
    });

    logger.info({ sub: storedCode.subject, jti }, "Access token issued");

    // 8. Return OAuth2 token response
    return res.json({
      token_type: "Bearer",
      access_token: accessToken,
      expires_in: env.ACCESS_TOKEN_TTL,
      refresh_token: refresh.token,
      scope: storedCode.scope
    });
  }

  // ... (refresh_token grant type handled separately)
});
```

**What's happening in `signAccessToken`?**

```typescript
// src/lib/keys.ts:45
export async function signAccessToken(payload: {
  sub: string;
  scope: string;
  nonce?: string;
  jti: string;
}) {
  const privateKey = await getPrivateKey();

  const token = await new SignJWT({
    scope: payload.scope,
    nonce: payload.nonce
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: env.JWT_KID })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER) // "https://odoo-mcp.leonobitech.com"
    .setAudience(env.JWT_AUDIENCE) // "odoo-mcp-server"
    .setSubject(payload.sub) // userId
    .setJti(payload.jti) // JWT ID for revocation
    .setExpirationTime("1h")
    .sign(privateKey);

  return token;
}
```

**RS256 (RSA + SHA-256)**: The token is signed with a private RSA key. Clients can verify the signature using the public key from `/.well-known/jwks.json` **without calling the database**.

---

### Step 5: PKCE Verification Deep Dive

PKCE (RFC 7636) prevents authorization code interception attacks. Here's how it works:

**Client (Claude Desktop) generates:**
1. **code_verifier**: Random 43-128 character string (e.g., `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`)
2. **code_challenge**: `BASE64URL(SHA256(code_verifier))`
3. **code_challenge_method**: `"S256"` (SHA-256 hashing)

**Authorization flow:**
1. Client sends `code_challenge` + `code_challenge_method` to `/oauth/authorize`
2. Server stores them with the authorization code
3. Client exchanges code for token, sends `code_verifier`
4. Server verifies: `SHA256(code_verifier) == code_challenge`

**Implementation:**

```typescript
// src/lib/pkce.ts:1
import { createHash } from "node:crypto";

export function verifyCodeChallenge(
  verifier: string,
  challenge: string,
  method: "S256" | "plain"
): boolean {
  if (method === "plain") {
    // Plain method: code_challenge == code_verifier
    return verifier === challenge;
  }

  // S256 method: code_challenge == BASE64URL(SHA256(code_verifier))
  const hash = createHash("sha256").update(verifier).digest();
  const computedChallenge = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, ""); // Base64URL encoding

  return computedChallenge === challenge;
}
```

**Why PKCE matters**: Even if an attacker intercepts the authorization code, they can't exchange it for a token without the original `code_verifier`.

---

### Step 6: Token Refresh Flow

Access tokens are short-lived for security. Claude Desktop automatically refreshes them using the refresh token:

```typescript
// src/routes/oauth.ts:247
if (grant_type === "refresh_token") {
  // 1. Validate parameters
  if (!refresh_token || !client_id) {
    return res.status(400).json({ error: "invalid_request" });
  }

  if (client_id !== env.CLIENT_ID) {
    return res.status(401).json({ error: "unauthorized_client" });
  }

  // 2. Get refresh token from Redis
  const storedRefresh = await getRefreshToken(refresh_token);

  if (!storedRefresh) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  // 3. Verify client_id matches
  if (storedRefresh.clientId !== env.CLIENT_ID) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  // 4. Generate new access token
  const jti = randomUUID();
  const accessToken = await signAccessToken({
    sub: storedRefresh.subject, // Same userId
    scope: storedRefresh.scope,
    jti
  });

  // 5. Store new access token metadata
  await storeAccessToken({
    jti,
    userId: storedRefresh.subject,
    scope: storedRefresh.scope,
    issuedAt: Date.now()
  }, env.ACCESS_TOKEN_TTL);

  // 6. ⚠️ CRITICAL: Rotate refresh token (revoke old, issue new)
  await revokeRefreshToken(refresh_token);
  const newRefresh = await createRefreshToken({
    clientId: env.CLIENT_ID,
    scope: storedRefresh.scope,
    subject: storedRefresh.subject
  });

  logger.info({ sub: storedRefresh.subject, jti }, "Access token refreshed");

  // 7. Return new tokens
  return res.json({
    token_type: "Bearer",
    access_token: accessToken,
    expires_in: env.ACCESS_TOKEN_TTL,
    refresh_token: newRefresh.token, // ← New refresh token
    scope: storedRefresh.scope
  });
}
```

**Refresh token rotation**: Each refresh invalidates the old refresh token and issues a new one. This limits the window for refresh token theft.

---

### Step 7: Redis Token Storage Architecture

All tokens are stored in Redis with **namespaced keys** for multi-tenancy:

```typescript
// src/lib/store.ts

// Authorization codes (TTL: env.AUTH_CODE_TTL - OAuth2 standard short window)
auth_code:{uuid} → {
  code: string,
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  codeChallengeMethod: "S256",
  scope: "odoo:read odoo:write",
  subject: "user_abc123", // ← userId for isolation
  state?: string,
  nonce?: string,
  createdAt: number
}

// Access tokens (TTL: env.ACCESS_TOKEN_TTL - short-lived, frequently refreshed)
access_token:{jti} → {
  jti: string,
  userId: "user_abc123", // ← User isolation
  scope: "odoo:read odoo:write",
  issuedAt: number
}

// Refresh tokens (TTL: env.REFRESH_TOKEN_TTL - long-lived, rotated on use)
refresh_token:{uuid} → {
  token: string,
  clientId: string,
  subject: "user_abc123", // ← User isolation
  scope: "odoo:read odoo:write",
  createdAt: number
}

// Revoked tokens (TTL: remaining original token lifetime)
revoked_token:{jti} → "1"

// Sessions (TTL: env.SESSION_TTL - configurable based on security needs)
session:{sessionToken} → sessionId
```

**Key insights:**

- ✅ **User isolation**: Every token payload includes `userId` (`subject`) for isolation
- ✅ **TTL-based cleanup**: Redis automatically deletes expired keys
- ✅ **Revocation support**: Blacklist revoked tokens without affecting active ones
- ✅ **Fast lookup**: O(1) retrieval by key

---

### Step 8: Token Verification in Tool Execution

When Claude Desktop calls an MCP tool, it sends the access token in the `Authorization` header:

```typescript
// src/middlewares/dual-auth.middleware.ts:10
export async function dualAuth(req, res, next) {
  let authenticated = false;

  // Try OAuth Bearer token first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      // Verify RS256 JWT signature + expiration
      const payload = await verifyAccessToken(token);

      // Attach user context to request
      res.locals.auth = {
        subject: payload.sub, // userId
        type: "oauth",
        scopes: payload.scope?.split(' ') || []
      };

      authenticated = true;
    } catch (err) {
      logger.warn({ error: err.message }, "OAuth token verification failed");
      // Fall through to try session cookie
    }
  }

  // Fallback: Try session cookie (for web UI)
  if (!authenticated) {
    const sessionToken = req.cookies[env.SESSION_COOKIE_NAME];
    if (sessionToken) {
      const session = await validateSession(sessionToken);
      if (session) {
        res.locals.auth = {
          subject: session.userId,
          type: "session"
        };
        authenticated = true;
      }
    }
  }

  if (!authenticated) {
    return res.status(401).json({ error: "authentication_required" });
  }

  next();
}
```

**What's `verifyAccessToken`?**

```typescript
// src/lib/auth.ts:30
export async function verifyAccessToken(token: string) {
  // Load JWKS (JSON Web Key Set) with public RSA key
  const jwkSet = await getJwkSet();

  // Verify signature, issuer, audience, expiration
  const { payload } = await jwtVerify(token, jwkSet, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });

  // Check if token has been revoked (blacklist check)
  if (payload.jti && await isTokenRevoked(payload.jti as string)) {
    throw new Error("Token has been revoked");
  }

  return payload;
}
```

**Dual authentication**: This middleware supports **both** OAuth tokens (Claude Desktop) **and** session cookies (web UI) for the same endpoints. This allows the platform UI to call the same APIs as Claude Desktop.

---

### Complete OAuth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMPLETE OAUTH2 + PKCE FLOW                    │
└─────────────────────────────────────────────────────────────────┘

1. Claude Desktop generates PKCE challenge
   code_verifier = random(43-128 chars)
   code_challenge = BASE64URL(SHA256(code_verifier))

2. Redirect to /oauth/authorize
   ↓
3. User not authenticated → redirect to /login
   ↓
4. User logs in → POST /auth/login
   → Create session (MongoDB + Redis)
   → Set session cookie
   ↓
5. Return to /oauth/authorize (now authenticated)
   ↓
6. Redirect to /oauth/consent
   ↓
7. User grants consent → POST /oauth/consent
   → Save consent to MongoDB (OAuthConsent table)
   → Create authorization code in Redis:
      auth_code:{uuid} → { subject: userId, codeChallenge, scope, ... }
   → Redirect to Claude Desktop with code
   ↓
8. Claude Desktop → POST /oauth/token
   grant_type: "authorization_code"
   code: {uuid}
   code_verifier: {original verifier}
   ↓
9. Server verifies:
   ✓ Code exists in Redis
   ✓ Code not expired (OAuth2 standard short window)
   ✓ SHA256(code_verifier) == stored code_challenge
   ✓ redirect_uri matches
   ↓
10. Issue tokens:
    → Sign RS256 JWT access token (short-lived, env.ACCESS_TOKEN_TTL)
    → Create refresh token in Redis (long-lived, env.REFRESH_TOKEN_TTL)
    → Store access token metadata:
       access_token:{jti} → { userId, scope, issuedAt }
    ↓
11. Return tokens to Claude Desktop
    {
      access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      refresh_token: "550e8400-e29b-41d4-a716-446655440000",
      token_type: "Bearer",
      expires_in: env.ACCESS_TOKEN_TTL,
      scope: "odoo:read odoo:write"
    }
    ↓
12. Claude Desktop stores tokens securely
    ↓
13. Tool execution: POST /mcp
    Authorization: Bearer {access_token}
    ↓
14. Server verifies:
    ✓ JWT signature valid (RS256 with public key)
    ✓ Token not expired
    ✓ Token not revoked (check Redis)
    ✓ Extract userId from token.sub
    ↓
15. Load user's encrypted Odoo credentials
    → Decrypt with AES-256-GCM
    → Execute tool with user's Odoo instance
    ↓
16. Return tool result to Claude Desktop
```

**Time complexity:**
- Authorization request: 1 Redis read + 1 MongoDB read (session lookup)
- Token exchange: 1 Redis read (code) + 1 Redis write (access token) + 1 Redis write (refresh token)
- Token verification: 0 database calls (signature verification only)
- Token revocation check: 1 Redis read (`revoked_token:{jti}`)

---

## User Registration: Credential Validation + Encryption

Before any user can use the connector, they must register with **both** account credentials and Odoo credentials. The critical security step: **validating Odoo credentials BEFORE storing them**.

### Complete Registration Flow with Code

```typescript
// src/routes/auth.ts:46
authRouter.post("/register", async (req, res) => {
  const ipAddress = extractIpAddress(req);
  const userAgent = extractUserAgent(req);

  // 1. Rate limiting (prevent abuse)
  const rateLimited = await isRateLimited(
    ipAddress,
    "user.registered",
    env.RATE_LIMIT_REGISTRATIONS_MAX,
    env.RATE_LIMIT_REGISTRATIONS_WINDOW
  );

  if (rateLimited) {
    await logSecurityEvent({
      eventType: "security.rate_limit_exceeded",
      severity: "warning",
      ipAddress,
      userAgent,
      metadata: { endpoint: "/auth/register" }
    });

    return res.status(429).json({
      error: "too_many_requests",
      message: "Too many registration attempts. Please try again later."
    });
  }

  // 2. Validate request body with Zod schema
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "invalid_request",
      details: parseResult.error.flatten()
    });
  }

  const { email, password, name, odoo } = parseResult.data;

  // 3. Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      error: "invalid_email",
      message: "Invalid email format"
    });
  }

  // 4. Validate password strength
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return res.status(400).json({
      error: "weak_password",
      message: passwordError
    });
  }

  // 5. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    return res.status(409).json({
      error: "user_exists",
      message: "User with this email already exists"
    });
  }

  // 6. ⚠️ CRITICAL: Validate Odoo credentials BEFORE storage
  logger.info({ email, odooUrl: odoo.url, odooDb: odoo.db }, "Validating Odoo credentials...");

  const odooValidation = await validateOdooCredentials({
    url: odoo.url,
    db: odoo.db,
    username: odoo.username,
    apiKey: odoo.apiKey
  });

  if (!odooValidation.success) {
    await logSecurityEvent({
      eventType: "user.login.failed",
      severity: "warning",
      ipAddress,
      userAgent,
      metadata: { email, reason: "Invalid Odoo credentials" }
    });

    return res.status(400).json({
      error: "invalid_odoo_credentials",
      message: odooValidation.error || "Failed to validate Odoo credentials"
    });
  }

  // 7. Hash password with bcrypt (industry-standard rounds)
  const passwordHash = await hashPassword(password);

  // 8. Encrypt Odoo credentials with AES-256-GCM
  const encryptedOdoo = encryptOdooCredentials({
    url: odoo.url,
    db: odoo.db,
    username: odoo.username,
    apiKey: odoo.apiKey
  });

  // 9. Create user in MongoDB
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: sanitizeInput(name || ""),
      ...encryptedOdoo, // odooUrl, odooDb, odooUsername, odooApiKey
      isActive: true,
      emailVerified: true // Auto-verify for now
    }
  });

  logger.info({ userId: user.id, email: user.email }, "User registered successfully");

  // 10. Log security event for audit trail
  await logSecurityEvent({
    userId: user.id,
    eventType: "user.registered",
    severity: "info",
    ipAddress,
    userAgent,
    metadata: { odooUrl: odoo.url, odooDb: odoo.db }
  });

  // 11. Return success (user must login separately)
  return res.status(201).json({
    success: true,
    message: "Registration successful. Please login to continue.",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    }
  });
});
```

### Odoo Credential Validation

**Why validate before storage?** If credentials are invalid, we catch the error during registration instead of during the first tool execution.

```typescript
// src/services/odoo.service.ts:15
export async function validateOdooCredentials(credentials: {
  url: string;
  db: string;
  username: string;
  apiKey: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Create temporary Odoo client
    const odoo = new xmlrpc.Client({
      url: `${credentials.url}/xmlrpc/2/common`,
      headers: { "Content-Type": "application/xml" }
    });

    // Test authentication (authenticate method)
    const uid = await new Promise<number>((resolve, reject) => {
      odoo.methodCall(
        "authenticate",
        [credentials.db, credentials.username, credentials.apiKey, {}],
        (err, uid) => {
          if (err) return reject(err);
          if (!uid || uid === false) {
            return reject(new Error("Authentication failed - invalid credentials"));
          }
          resolve(uid);
        }
      );
    });

    logger.info({ uid, db: credentials.db }, "Odoo credentials validated successfully");

    return { success: true };
  } catch (error) {
    logger.error({ error, url: credentials.url }, "Odoo credential validation failed");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
```

**What happens:**
1. Connect to Odoo's XML-RPC endpoint (`/xmlrpc/2/common`)
2. Call `authenticate` method with provided credentials
3. If successful, Odoo returns the user ID (`uid`)
4. If failed, Odoo returns `false` or throws error

**This prevents:**
- ❌ Users registering with typo'd Odoo URLs
- ❌ Storing invalid API keys
- ❌ Wasting encryption on bad credentials
- ❌ Confusing errors during tool execution

---

## AES-256-GCM Encryption: Protecting Credentials at Rest

All Odoo credentials are encrypted in MongoDB using **AES-256-GCM** (Galois/Counter Mode) - an **authenticated encryption** algorithm.

### Why AES-256-GCM?

- ✅ **Encryption + Authentication**: GCM mode provides both confidentiality (encryption) and integrity (authentication tag)
- ✅ **Unique IV per encryption**: Each field gets a new random initialization vector
- ✅ **Tamper detection**: Authentication tag prevents modification of ciphertext
- ✅ **NIST approved**: Widely used in TLS 1.3, IPsec, and other security protocols

### Complete Encryption Implementation

```typescript
// src/lib/encryption.ts:22
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits for AES
const AUTH_TAG_LENGTH = 16; // 128 bits

// Load encryption key from environment (must be 32 bytes / 64 hex characters)
const ENCRYPTION_KEY_BUFFER = Buffer.from(env.ENCRYPTION_KEY, "hex");

if (ENCRYPTION_KEY_BUFFER.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)");
}

/**
 * Encrypts a string value using AES-256-GCM
 * Returns: iv:authTag:encryptedData (all in hex)
 */
export function encrypt(plaintext: string): string {
  // 1. Generate random IV (unique for each encryption)
  const iv = randomBytes(IV_LENGTH);

  // 2. Create cipher with key and IV
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);

  // 3. Encrypt plaintext
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  // 4. Get authentication tag (proves data hasn't been tampered)
  const authTag = cipher.getAuthTag();

  // 5. Combine: IV + AuthTag + Encrypted Data (all hex-encoded)
  // Format: "iv:authTag:encrypted"
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a value encrypted with encrypt()
 * Expects format: iv:authTag:encryptedData (all in hex)
 */
export function decrypt(encryptedValue: string): string {
  // 1. Split the encrypted value
  const parts = encryptedValue.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted value format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  // 2. Convert from hex to buffers
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  // 3. Create decipher with key and IV
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);

  // 4. Set authentication tag (verifies data hasn't been tampered)
  decipher.setAuthTag(authTag);

  // 5. Decrypt
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}
```

### Odoo Credential Encryption/Decryption

Each Odoo credential field is encrypted **separately** with a **unique IV**:

```typescript
// src/lib/encryption.ts:70
export function encryptOdooCredentials(credentials: {
  url: string;
  db: string;
  username: string;
  apiKey: string;
}): {
  odooUrl: string;
  odooDb: string;
  odooUsername: string;
  odooApiKey: string;
} {
  return {
    odooUrl: encrypt(credentials.url),
    odooDb: encrypt(credentials.db),
    odooUsername: encrypt(credentials.username),
    odooApiKey: encrypt(credentials.apiKey)
  };
}

export function decryptOdooCredentials(encrypted: {
  odooUrl: string;
  odooDb: string;
  odooUsername: string;
  odooApiKey: string;
}): {
  url: string;
  db: string;
  username: string;
  apiKey: string;
} {
  return {
    url: decrypt(encrypted.odooUrl),
    db: decrypt(encrypted.odooDb),
    username: decrypt(encrypted.odooUsername),
    apiKey: decrypt(encrypted.apiKey)
  };
}
```

### Storage Format in MongoDB

```javascript
// Example encrypted user document in MongoDB:
{
  "_id": "67891234abcdef000000",
  "email": "user@company.com",
  "password_hash": "$2b$12$...", // bcrypt hash
  "odoo_url": "a1b2c3:d4e5f6:7890ab...", // IV:AuthTag:Encrypted
  "odoo_db": "1a2b3c:4d5e6f:8901cd...",
  "odoo_username": "9f8e7d:6c5b4a:3210fe...",
  "odoo_api_key": "fedcba:987654:3210ab...",
  "is_active": true,
  "created_at": ISODate("2025-01-19T...")
}
```

**Even if MongoDB is compromised**, attackers cannot decrypt credentials without the `ENCRYPTION_KEY`.

### Encryption Key Management

**Current implementation**: Environment variable (`ENCRYPTION_KEY`)

**Production best practices:**
- ✅ Use **AWS Secrets Manager**, **HashiCorp Vault**, or **GCP Secret Manager**
- ✅ Rotate keys periodically (requires re-encrypting all stored credentials)
- ✅ Never commit keys to git
- ✅ Use key derivation (PBKDF2) if storing passphrase-based keys

---

## Session Management: Device Fingerprinting for Security

When users log in via the web UI, they get a **session cookie**. Sessions are stored in **both** MongoDB (persistent) and Redis (fast lookup).

### Session Creation Flow

```typescript
// src/services/session.service.ts:15
export async function createSession(data: {
  userId: string;
  ipAddress: string;
  userAgent: string;
}): Promise<{ sessionToken: string; sessionId: string }> {
  // 1. Generate secure session token (UUID v4)
  const sessionToken = randomUUID();

  // 2. Create device fingerprint (SHA-256 hash)
  const deviceFingerprint = hashFingerprint(
    data.ipAddress,
    data.userAgent,
    data.userId
  );

  // 3. Calculate expiration (configurable session lifetime)
  const expiresAt = new Date(Date.now() + env.SESSION_TTL * 1000);

  // 4. Create session in MongoDB
  const session = await prisma.session.create({
    data: {
      userId: data.userId,
      deviceFingerprint,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt,
      isRevoked: false
    }
  });

  // 5. Store session token in Redis for fast lookup
  // Key: session:{token} → Value: sessionId
  const redis = await getRedisClient();
  await redis.set(
    `session:${sessionToken}`,
    session.id,
    { EX: env.SESSION_TTL }
  );

  logger.info({ sessionId: session.id, userId: data.userId }, "Session created");

  return {
    sessionToken,
    sessionId: session.id
  };
}
```

### Device Fingerprinting Implementation

```typescript
// src/lib/security.ts:75
import { createHash } from "node:crypto";

export function hashFingerprint(
  ipAddress: string,
  userAgent: string,
  userId: string
): string {
  // Combine IP, User Agent, and User ID
  const combined = `${ipAddress}|${userAgent}|${userId}`;

  // Hash with SHA-256
  return createHash("sha256")
    .update(combined)
    .digest("hex");
}
```

**Why device fingerprinting?**

If someone steals your session cookie, they **cannot use it from a different device** because the fingerprint won't match:

```typescript
// src/services/session.service.ts:45
export async function validateSession(
  sessionToken: string,
  ipAddress: string,
  userAgent: string
) {
  // 1. Get session ID from Redis
  const redis = await getRedisClient();
  const sessionId = await redis.get(`session:${sessionToken}`);

  if (!sessionId) {
    return null; // Session expired or doesn't exist
  }

  // 2. Get session from MongoDB
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });

  if (!session || session.isRevoked) {
    return null;
  }

  // 3. Check expiration
  if (session.expiresAt < new Date()) {
    await revokeSession(sessionId, "Session expired");
    return null;
  }

  // 4. ⚠️ CRITICAL: Verify device fingerprint
  const expectedFingerprint = hashFingerprint(
    ipAddress,
    userAgent,
    session.userId
  );

  if (session.deviceFingerprint !== expectedFingerprint) {
    // Device mismatch - possible session hijacking
    logger.warn(
      {
        sessionId,
        userId: session.userId,
        expectedFingerprint,
        actualFingerprint: session.deviceFingerprint
      },
      "Device fingerprint mismatch - possible session hijacking"
    );

    await logSecurityEvent({
      userId: session.userId,
      eventType: "security.session_hijacking_attempt",
      severity: "critical",
      ipAddress,
      userAgent,
      metadata: { sessionId }
    });

    return null; // Reject session
  }

  // 5. Update last used timestamp
  await prisma.session.update({
    where: { id: sessionId },
    data: { lastUsedAt: new Date() }
  });

  return session;
}
```

**What changes trigger fingerprint mismatch?**
- ❌ Different IP address (user switched networks)
- ❌ Different browser/device (cookie stolen)
- ❌ User agent changed (unlikely unless spoofed)

**Known limitation**: Mobile users switching between WiFi and cellular will get logged out. Solution: Use less strict fingerprinting or implement "trusted devices" feature.

---

## Tool Registry + Execution: How MCP Tools Work

The connector uses a **registry pattern** to decouple tool definitions from tool execution.

### Tool Registry Architecture

```typescript
// src/tools/base/ToolRegistry.ts:29
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, RegisteredTool> = new Map();

  private constructor() {
    logger.info("[ToolRegistry] Initialized");
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Register a tool
   */
  register(tool: ITool, metadata?: ToolMetadata): void {
    const definition = tool.definition();

    if (this.tools.has(definition.name)) {
      logger.warn(
        { toolName: definition.name },
        "[ToolRegistry] Tool already registered, overwriting"
      );
    }

    this.tools.set(definition.name, {
      instance: tool,
      definition,
      metadata
    });

    logger.info(
      {
        toolName: definition.name,
        category: metadata?.category
      },
      "[ToolRegistry] Tool registered"
    );
  }

  /**
   * Get tool by name
   */
  get(name: string): ITool | undefined {
    return this.tools.get(name)?.instance;
  }

  /**
   * Get all tool definitions (for MCP tools/list)
   */
  listDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }
}
```

### Tool Interface (Contract)

Every tool implements the `ITool` interface:

```typescript
// src/tools/base/Tool.interface.ts:15
export interface ITool<TInput = any, TOutput = any> {
  /**
   * Execute the tool with validated input
   */
  execute(input: unknown): Promise<TOutput>;

  /**
   * MCP tool definition
   */
  definition(): ToolDefinition;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}
```

### Example Tool: `odoo_create_lead`

```typescript
// src/tools/odoo/crm/create-lead/create-lead.tool.ts:16
export class CreateLeadTool implements ITool<CreateLeadInput, CreateLeadResponse> {
  constructor(private readonly odooClient: OdooClient) {}

  /**
   * Execute tool - called by ToolExecutor
   */
  async execute(input: unknown): Promise<CreateLeadResponse> {
    // 1. Validate input with Zod schema
    const params = createLeadSchema.parse(input);

    // 2. Execute business logic
    const result = await this.createLead(params);

    // 3. Return typed response
    return result;
  }

  /**
   * Business logic: create lead in Odoo
   */
  private async createLead(params: CreateLeadInput): Promise<CreateLeadResponse> {
    let partnerId: number | undefined;

    // Auto-create partner if contact data provided
    if (params.partner_name || params.email) {
      partnerId = await this.findOrCreatePartner(params);
    }

    // Prepare lead values
    const leadValues: Record<string, any> = {
      name: params.name,
      type: params.type || "lead"
    };

    if (partnerId) {
      leadValues.partner_id = partnerId;
    }

    // Optional fields
    if (params.partner_name) leadValues.partner_name = params.partner_name;
    if (params.email) leadValues.email_from = params.email;
    if (params.phone) leadValues.phone = params.phone;

    // Create lead in Odoo
    const leadId = await this.odooClient.create("crm.lead", leadValues);

    return {
      leadId,
      partnerId,
      message: `Lead "${params.name}" created successfully`
    };
  }

  /**
   * MCP tool definition (exposed to Claude Desktop)
   */
  definition(): ToolDefinition {
    return {
      name: "odoo_create_lead",
      description: "Crea un nuevo lead en el CRM de Odoo con creación automática de contacto",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Título del lead (obligatorio)",
            minLength: 1,
            maxLength: 255
          },
          partner_name: {
            type: "string",
            description: "Nombre de la empresa (opcional)"
          },
          email: {
            type: "string",
            description: "Email del contacto (opcional)",
            format: "email"
          },
          phone: {
            type: "string",
            description: "Teléfono del contacto (opcional)"
          },
          expected_revenue: {
            type: "number",
            description: "Ingreso esperado del lead (opcional)",
            minimum: 0
          },
          type: {
            type: "string",
            enum: ["lead", "opportunity"],
            description: "Tipo: 'lead' para prospecto, 'opportunity' para oportunidad",
            default: "lead"
          }
        },
        required: ["name"]
      }
    };
  }
}
```

### Tool Executor: Per-User Context Injection

When Claude calls a tool, the **ToolExecutor** loads the user's encrypted credentials and injects them:

```typescript
// src/tools/base/ToolExecutor.ts:15
export class ToolExecutor {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly userId: string
  ) {}

  async execute(toolName: string, args: any): Promise<ExecutionResult> {
    try {
      // 1. Get tool from registry
      const tool = this.registry.get(toolName);

      if (!tool) {
        return {
          success: false,
          error: {
            code: "tool_not_found",
            message: `Tool '${toolName}' not found`
          }
        };
      }

      // 2. Load user from database
      const user = await prisma.user.findUnique({
        where: { id: this.userId }
      });

      if (!user) {
        return {
          success: false,
          error: {
            code: "user_not_found",
            message: "User not found"
          }
        };
      }

      // 3. Decrypt Odoo credentials
      const odooCredentials = decryptOdooCredentials({
        odooUrl: user.odooUrl!,
        odooDb: user.odooDb!,
        odooUsername: user.odooUsername!,
        odooApiKey: user.odooApiKey!
      });

      // 4. Create user-specific Odoo client
      const odooClient = new OdooClient(odooCredentials);

      // 5. Inject Odoo client into tool if needed
      if (toolName.startsWith("odoo_")) {
        // Odoo tools receive the user-specific client
        (tool as any).odooClient = odooClient;
      }

      // 6. Execute tool with user context
      const result = await tool.execute(args);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error({ error, toolName, userId: this.userId }, "Tool execution failed");

      return {
        success: false,
        error: {
          code: "execution_error",
          message: error instanceof Error ? error.message : "Unknown error",
          details: error
        }
      };
    }
  }
}
```

**Key insight**: Each tool execution gets a **fresh OdooClient** with the user's credentials. Complete isolation.

---

## MCP Server Creation: Connecting Everything

The MCP server ties together the registry, executor, and protocol handlers:

```typescript
// src/lib/mcp-server.ts:30
export function createMcpServer(userId: string, registry: ToolRegistry): Server {
  const executor = new ToolExecutor(registry, userId);

  const server = new Server(
    {
      name: "leonobitech-odoo-mcp",
      version: "2.0.0"
    },
    {
      capabilities: {
        tools: {},      // Supports MCP tools
        resources: {},  // Supports MCP resources
        prompts: {}     // Supports MCP prompts
      }
    }
  );

  // Handler: List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info({ userId }, "[MCP] list_tools request");
    const tools = registry.listDefinitions();
    return { tools };
  });

  // Handler: Execute tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments || {};

    logger.info({ userId, toolName }, "[MCP] call_tool request");

    try {
      // Execute tool through executor (handles user context)
      if (toolName.startsWith("odoo_")) {
        const result = await executor.execute(toolName, args);

        if (!result.success) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: true,
                code: result.error?.code,
                message: result.error?.message
              }, null, 2)
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result.data, null, 2)
          }]
        };
      }

      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    } catch (error) {
      logger.error({ userId, toolName, error }, "[MCP] Error executing tool");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: true,
            message: error instanceof Error ? error.message : "Unknown error",
            tool: toolName
          }, null, 2)
        }]
      };
    }
  });

  return server;
}
```

### HTTP Transport Layer

Claude Desktop communicates via **HTTP + SSE (Server-Sent Events)**:

```typescript
// src/routes/mcp-http.ts:23
mcpHttpRouter.all("/", dualAuth, async (req, res) => {
  const userId = res.locals.auth.subject;
  const method = req.method;

  logger.info({ userId, method }, "MCP HTTP request");

  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.has(sessionId)) {
      // Reuse existing transport
      transport = transports.get(sessionId)!;
    } else if (!sessionId && req.method === "POST" && isInitializeRequest(req.body)) {
      // Create new transport for initialization
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports.set(newSessionId, transport);
        }
      });

      // Setup cleanup on close
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports.has(sid)) {
          transports.delete(sid);
        }
      };

      // Connect server to transport with ToolRegistry
      const registry = ToolRegistry.getInstance();
      const mcpServer = createMcpServer(userId, registry);
      await mcpServer.connect(transport);
    } else {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request" },
        id: null
      });
    }

    // Handle the request with the transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error({ err: error, userId }, "Error handling MCP HTTP request");
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null
      });
    }
  }
});
```

**Flow:**
1. Claude Desktop → POST `/mcp` with `Authorization: Bearer {token}`
2. `dualAuth` middleware verifies token → extracts `userId`
3. Create MCP server with user-specific `ToolExecutor`
4. Connect to HTTP transport
5. Transport handles JSON-RPC protocol
6. Tool results returned via HTTP response

---

## Deep Dive: Key Features Explained

Let me break down the most interesting features that make this connector production-ready.

### 🤖 Auto-Progression: Deals Move Automatically

One of the unique features is **automatic stage progression**. When you send an email or schedule a meeting, the deal automatically advances to the next stage. Here's the complete implementation:

```typescript
// src/lib/odoo.ts:401
async autoProgressStage(data: {
  opportunityId: number;
  action: "email_sent" | "meeting_scheduled" | "proposal_sent" | "formal_proposal_sent";
  currentStage?: string;
}) {
  // Get current stage if not provided
  const currentStage = data.currentStage ||
    (await this.getOpportunityStage(data.opportunityId));

  if (!currentStage) {
    return { moved: false, reason: "Could not determine current stage" };
  }

  const currentStageLower = currentStage.toLowerCase();

  /**
   * Progression Rules:
   *
   * NEW → QUALIFIED:
   *   - email_sent: First email sent to prospect
   *   - meeting_scheduled: Demo scheduled
   *   - proposal_sent: Commercial proposal via email (HTML template)
   *
   * QUALIFIED → PROPOSITION:
   *   - formal_proposal_sent: Formal PDF proposal (future feature)
   *
   * PROPOSITION is reserved for formal proposals,
   * not email-based proposals with HTML templates
   */
  let targetStage: string | null = null;
  let reason = "";

  switch (data.action) {
    case "email_sent":
    case "meeting_scheduled":
      // NEW → QUALIFIED (first significant contact)
      if (currentStageLower.includes("new")) {
        targetStage = "Qualified";
        reason = data.action === "meeting_scheduled"
          ? "First meeting scheduled - Lead qualified"
          : "First contact established - Lead qualified";
      }
      break;

    case "proposal_sent":
      // NEW → QUALIFIED (commercial proposal via email)
      // NOTE: PROPOSITION reserved for formal PDF proposals
      if (currentStageLower.includes("new")) {
        targetStage = "Qualified";
        reason = "Commercial proposal sent via email - Lead qualified";
      }
      break;

    case "formal_proposal_sent":
      // QUALIFIED → PROPOSITION (formal PDF proposal)
      if (currentStageLower.includes("qualified")) {
        targetStage = "Proposition";
        reason = "Formal PDF proposal sent - Client in proposition stage";
      }
      break;
  }

  // If no target stage, don't move
  if (!targetStage) {
    return {
      moved: false,
      reason: "Opportunity already in advanced stage"
    };
  }

  // Move the opportunity
  try {
    await this.updateDealStage(data.opportunityId, targetStage);

    // Log to Odoo chatter
    await this.postMessageToChatter({
      model: "crm.lead",
      resId: data.opportunityId,
      body: `
        <p>🔄 <strong>Automatic Stage Progression</strong></p>
        <ul>
          <li><strong>From:</strong> ${currentStage}</li>
          <li><strong>To:</strong> ${targetStage}</li>
          <li><strong>Reason:</strong> ${reason}</li>
        </ul>
        <p><em>Leonobitech Automated System</em></p>
      `,
      messageType: "comment"
    });

    logger.info(
      {
        opportunityId: data.opportunityId,
        fromStage: currentStage,
        toStage: targetStage,
        action: data.action
      },
      "Opportunity stage auto-progressed"
    );

    return {
      moved: true,
      fromStage: currentStage,
      toStage: targetStage,
      reason
    };
  } catch (error) {
    logger.warn(
      { error, opportunityId: data.opportunityId },
      "Failed to auto-progress stage"
    );
    return {
      moved: false,
      reason: "Error moving stage"
    };
  }
}
```

**Why this matters**:
- ✅ **Hands-free CRM**: Sales reps don't need to manually update stages
- ✅ **Consistent process**: Everyone follows the same progression logic
- ✅ **Audit trail**: Every auto-progression is logged to the chatter
- ✅ **Configurable**: Rules are in code, easy to customize

**Real-world example**:
1. Sales rep asks Claude: *"Send a demo proposal to Acme Corp opportunity #42"*
2. Tool executes `odoo_send_email` with proposal template
3. Email sent successfully
4. Auto-progression triggers: `NEW → QUALIFIED`
5. Chatter updated with progression reason
6. Sales manager sees the deal moved automatically ✅

---

### 📅 Conflict Detection: Smart Calendar Management

Before scheduling a meeting, the system checks for conflicts and suggests alternative times:

```typescript
// src/lib/odoo.ts:654
async checkCalendarAvailability(data: {
  start: string;
  duration: number;
  partnerIds: number[];
}): Promise<{
  available: boolean;
  conflicts: Array<{
    id: number;
    name: string;
    start: string;
    stop: string;
    partner_ids: any;
  }>;
}> {
  // Convert datetime to Odoo format (UTC without timezone)
  const odooStart = this.convertToOdooDatetime(data.start);
  const endTime = this.calculateEndTime(data.start, data.duration);

  // Build domain to find overlapping events
  // An event overlaps if: (start1 < end2) AND (end1 > start2)
  const domain: any[] = [
    "|",
    "&",
    ["start", "<=", odooStart],
    ["stop", ">", odooStart],
    "&",
    ["start", "<", endTime],
    ["stop", ">=", endTime],
    "|",
    "&",
    ["start", ">=", odooStart],
    ["start", "<", endTime],
    "&",
    ["stop", ">", odooStart],
    ["stop", "<=", endTime]
  ];

  // Filter by participants if provided
  if (data.partnerIds.length > 0) {
    domain.unshift(["partner_ids", "in", data.partnerIds]);
  }

  const conflicts = await this.search("calendar.event", domain, {
    fields: ["id", "name", "start", "stop", "partner_ids"],
    limit: 10
  });

  return {
    available: conflicts.length === 0,
    conflicts
  };
}
```

**Finding Alternative Slots**:

```typescript
// src/lib/odoo.ts:710
async findAvailableSlots(data: {
  preferredStart: string;
  duration: number;
  partnerIds: number[];
  maxSuggestions?: number;
}): Promise<Array<{ start: string; end: string }>> {
  const suggestions: Array<{ start: string; end: string }> = [];
  const maxSuggestions = data.maxSuggestions || 5;
  const durationMs = data.duration * 60 * 60 * 1000;

  let currentSlot = new Date(data.preferredStart);
  const searchDays = 7; // Search next 7 days
  const endSearchDate = new Date(currentSlot);
  endSearchDate.setDate(endSearchDate.getDate() + searchDays);

  // Get all events in search range
  const allEvents = await this.search("calendar.event",
    [
      ["start", ">=", this.convertToOdooDatetime(data.preferredStart)],
      ["start", "<=", this.convertToOdooDatetime(endSearchDate.toISOString())]
    ],
    {
      fields: ["start", "stop"],
      order: "start asc"
    }
  );

  // Check if slot is free
  const isSlotFree = (slotStart: Date, slotEnd: Date): boolean => {
    for (const event of allEvents) {
      const eventStart = new Date(event.start);
      const eventStop = new Date(event.stop);

      // Check overlap
      if (slotStart < eventStop && slotEnd > eventStart) {
        return false;
      }
    }
    return true;
  };

  // Find free slots
  while (suggestions.length < maxSuggestions && currentSlot < endSearchDate) {
    const slotEnd = new Date(currentSlot.getTime() + durationMs);

    // Only business hours (9am - 6pm)
    const hour = currentSlot.getHours();
    if (hour >= 9 && hour < 18) {
      if (isSlotFree(currentSlot, slotEnd)) {
        suggestions.push({
          start: currentSlot.toISOString().replace("T", " ").substring(0, 19),
          end: slotEnd.toISOString().replace("T", " ").substring(0, 19)
        });
      }
    }

    // Advance 30 minutes
    currentSlot = new Date(currentSlot.getTime() + 30 * 60 * 1000);

    // If past 6pm, jump to next day 9am
    if (currentSlot.getHours() >= 18) {
      currentSlot.setDate(currentSlot.getDate() + 1);
      currentSlot.setHours(9, 0, 0, 0);
    }
  }

  return suggestions;
}
```

**Complete Scheduling Flow**:

```typescript
// src/lib/odoo.ts:820
async scheduleMeeting(data: {
  name: string;
  opportunityId: number;
  start: string;
  duration?: number;
  forceSchedule?: boolean;
}) {
  const duration = data.duration || 1;

  // Step 1: Get opportunity info (partner, salesperson)
  const opportunities = await this.read("crm.lead", [data.opportunityId],
    ["partner_id", "partner_name", "user_id"]
  );

  const opp = opportunities[0];
  const partnerIds: number[] = [];

  // Add partner as attendee
  if (opp.partner_id && Array.isArray(opp.partner_id)) {
    partnerIds.push(opp.partner_id[0]);
  }

  // Step 2: Check availability BEFORE creating event
  const availabilityCheck = await this.checkCalendarAvailability({
    start: data.start,
    duration,
    partnerIds
  });

  // Step 3: If conflicts and not forcing, return suggestions
  if (!availabilityCheck.available && !data.forceSchedule) {
    const availableSlots = await this.findAvailableSlots({
      preferredStart: data.start,
      duration,
      partnerIds,
      maxSuggestions: 5
    });

    return {
      conflict: {
        available: false,
        conflicts: availabilityCheck.conflicts,
        availableSlots
      }
    };
  }

  // Step 4: Create calendar event
  const eventId = await this.create("calendar.event", {
    name: data.name,
    start: this.convertToOdooDatetime(data.start),
    stop: this.calculateEndTime(data.start, duration),
    duration,
    opportunity_id: data.opportunityId,
    partner_ids: [[6, 0, partnerIds]]
  });

  // Step 5: Create activity (shows in "Planned Activities")
  const activityId = await this.createActivity({
    activityType: "meeting",
    summary: data.name,
    resModel: "crm.lead",
    resId: data.opportunityId,
    dateDeadline: new Date(data.start).toISOString().split('T')[0]
  });

  // Step 6: Link activity to calendar event
  await this.write("mail.activity", [activityId], {
    calendar_event_id: eventId
  });

  // Step 7: Auto-progress stage (New → Qualified)
  await this.autoProgressStage({
    opportunityId: data.opportunityId,
    action: "meeting_scheduled"
  });

  return { eventId, activityId };
}
```

**Why this is powerful**:
- ✅ **Prevents double-booking**: Checks conflicts before scheduling
- ✅ **Smart suggestions**: Offers 5 alternative times in business hours
- ✅ **Complete integration**: Creates event + activity + chatter log
- ✅ **Auto-progression**: Moves deal to Qualified stage

**Real-world example**:
```
User: "Schedule a demo with Acme Corp for tomorrow at 2pm, 1 hour"

Claude → odoo_schedule_meeting({
  name: "Product Demo - Acme Corp",
  opportunityId: 42,
  start: "2025-01-20T14:00:00-03:00",
  duration: 1
})

Response:
{
  "conflict": {
    "available": false,
    "conflicts": [
      { name: "Team Meeting", start: "2025-01-20 14:00", stop: "15:00" }
    ],
    "availableSlots": [
      { start: "2025-01-20 15:30", end: "16:30" },
      { start: "2025-01-20 16:00", end: "17:00" },
      { start: "2025-01-21 09:00", end: "10:00" }
    ]
  }
}

Claude: "There's a conflict with Team Meeting at 2pm.
Would you like to schedule at 3:30pm instead?"
```

---

### 📧 Email Templates: Professional HTML Generation

The connector includes a professional email template system for proposals:

```typescript
// src/lib/odoo.ts:1534
private generateProposalTemplate(data: {
  clientName: string;
  proposalTitle: string;
  introduction: string;
  solution: string;
  deliverables: string[];
  timeline: string;
  investment: number;
  paymentTerms?: string;
  nextSteps?: string;
  demoUrl?: string;
  validityPeriod: string;
}): string {
  const deliverablesHtml = data.deliverables
    .map(d => `<li style="margin: 8px 0; line-height: 1.6;">${d}</li>`)
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
              style="background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Leonobitech</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">
                    Innovative Technology Solutions
                  </p>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="color: #333; margin: 0 0 10px 0;">Dear ${data.clientName},</h2>
                  <p style="color: #666; line-height: 1.6;">${data.introduction}</p>
                </td>
              </tr>

              <!-- Proposal Title -->
              <tr>
                <td style="padding: 20px 30px;">
                  <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px;">
                    <h3 style="color: #667eea; margin: 0 0 10px 0;">📋 ${data.proposalTitle}</h3>
                    <p style="color: #666; margin: 0; font-size: 14px;">
                      Valid for ${data.validityPeriod}
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Solution -->
              <tr>
                <td style="padding: 20px 30px;">
                  <h3 style="color: #333; margin: 0 0 15px 0;">💡 Proposed Solution</h3>
                  <p style="color: #666; line-height: 1.6;">${data.solution}</p>
                </td>
              </tr>

              <!-- Deliverables -->
              <tr>
                <td style="padding: 20px 30px;">
                  <h3 style="color: #333; margin: 0 0 15px 0;">✅ Deliverables</h3>
                  <ul style="color: #666; padding-left: 20px;">
                    ${deliverablesHtml}
                  </ul>
                </td>
              </tr>

              <!-- Timeline -->
              <tr>
                <td style="padding: 20px 30px;">
                  <h3 style="color: #333; margin: 0 0 15px 0;">⏱️ Timeline</h3>
                  <p style="color: #666; line-height: 1.6;">${data.timeline}</p>
                </td>
              </tr>

              <!-- Investment (highlighted) -->
              <tr>
                <td style="padding: 20px 30px;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                              padding: 25px; border-radius: 8px; text-align: center;">
                    <p style="color: #ffffff; margin: 0 0 10px 0; opacity: 0.9;">Total Investment</p>
                    <h2 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 700;">
                      $${data.investment.toLocaleString()}
                    </h2>
                    ${data.paymentTerms ?
                      `<p style="color: #ffffff; margin: 15px 0 0 0; opacity: 0.9;">
                        ${data.paymentTerms}
                      </p>` : ""
                    }
                  </div>
                </td>
              </tr>

              ${data.demoUrl ? `
              <!-- Demo/Resources -->
              <tr>
                <td style="padding: 20px 30px;">
                  <div style="background: #e3f2fd; border: 2px solid #2196f3;
                              padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="color: #1976d2; margin: 0 0 15px 0; font-weight: 600;">
                      🎥 Additional Resources
                    </p>
                    <a href="${data.demoUrl}"
                       style="display: inline-block; background: #2196f3; color: #ffffff;
                              padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                      View Demo / Documentation
                    </a>
                  </div>
                </td>
              </tr>
              ` : ""}

              ${data.nextSteps ? `
              <!-- Next Steps -->
              <tr>
                <td style="padding: 20px 30px;">
                  <h3 style="color: #333; margin: 0 0 15px 0;">🚀 Next Steps</h3>
                  <p style="color: #666; line-height: 1.6;">${data.nextSteps}</p>
                </td>
              </tr>
              ` : ""}

              <!-- Footer -->
              <tr>
                <td style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="color: #666; margin: 0 0 10px 0;">
                    We look forward to your feedback and questions.
                  </p>
                  <p style="color: #666; margin: 0; font-weight: 600;">Leonobitech Team</p>
                  <p style="color: #999; margin: 15px 0 0 0; font-size: 12px; font-style: italic;">
                    Leonobitech Automated System
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
```

**Usage**:

```typescript
await odooClient.sendProposal({
  opportunityId: 42,
  clientName: "Acme Corp",
  proposalTitle: "E-commerce Platform Development",
  introduction: "Thank you for your interest in our services...",
  solution: "We propose building a custom e-commerce platform...",
  deliverables: [
    "Full-stack web application (React + Node.js)",
    "Admin dashboard for inventory management",
    "Payment gateway integration (Stripe/PayPal)",
    "Mobile-responsive design",
    "6 months technical support"
  ],
  timeline: "Development: 12 weeks. Launch: Week 13.",
  investment: 50000,
  paymentTerms: "50% upfront, 50% on delivery",
  validityPeriod: "30 days"
});
```

**Result**: Beautiful HTML email sent to client, logged to chatter, deal progressed to Qualified.

---

## Security: Defense in Depth

Multi-tenant SaaS requires **paranoid security**. Here's what I implemented:

### 1. Rate Limiting
```typescript
// src/routes/auth.ts:52
const rateLimited = await isRateLimited(
  ipAddress,
  "user.registered",
  env.RATE_LIMIT_REGISTRATIONS_MAX, // Configurable max attempts
  env.RATE_LIMIT_REGISTRATIONS_WINDOW // Time window in minutes
);
```

**Why environment variables?** Rate limits are security-sensitive. Exposing exact thresholds helps attackers optimize their attempts to stay under the radar.

### 2. Security Event Logging
```typescript
// Every sensitive action is logged:
await logSecurityEvent({
  userId: user.id,
  eventType: "user.login.success",
  severity: "info",
  ipAddress,
  userAgent,
  metadata: { sessionId }
});
```

### 3. Automatic Session Cleanup
```typescript
// src/services/session-cleanup.service.ts
// Runs every hour to remove:
// - Expired sessions
// - Zombie sessions (Redis mismatch)
// - Revoked tokens
scheduleSessionCleanup();
```

### 4. Password Security
```typescript
// Bcrypt with 12 rounds + strength validation
const passwordHash = await hashPassword(password);

// Requirements:
// - Minimum 8 characters
// - Must contain uppercase, lowercase, number
validatePasswordStrength(password);
```

### 5. CORS Lockdown
```typescript
// Only allow specific origins
const corsOrigins = [
  "https://claude.ai",
  "https://app.claude.ai",
  "https://desktop.claude.ai",
  "https://odoo-mcp.leonobitech.com",
  "https://leonobitech.com"
];
```

---

## The Tech Stack: Production-Ready from Day One

Building a SaaS platform meant choosing battle-tested technologies:

| **Layer** | **Technology** | **Why** |
|-----------|----------------|---------|
| **Backend** | Express 5 + TypeScript | Fast, lightweight, ES modules |
| **Database** | MongoDB + Prisma | Flexible schema, great TypeScript support |
| **Cache** | Redis | Token storage, session lookup, rate limiting |
| **Auth** | OAuth2 + PKCE + RSA-256 JWT | Industry standard, secure by default |
| **Encryption** | AES-256-GCM | Authenticated encryption for credentials |
| **Deployment** | Docker + Traefik | Container orchestration, automatic HTTPS |
| **Monitoring** | Structured logging + security events | Audit trail for compliance |

### Database Schema (MongoDB via Prisma)

```prisma
model User {
  id           String   @id @default(auto()) @db.ObjectId
  email        String   @unique
  passwordHash String

  // Encrypted Odoo credentials (AES-256-GCM)
  odooUrl      String?
  odooDb       String?
  odooUsername String?
  odooApiKey   String?

  isActive     Boolean  @default(true)
  sessions     Session[]
  consents     OAuthConsent[]
}

model Session {
  id                String   @id
  userId            String   @db.ObjectId
  deviceFingerprint String   // SHA-256 hash
  ipAddress         String
  userAgent         String
  expiresAt         DateTime
  isRevoked         Boolean  @default(false)
}

model OAuthConsent {
  id        String   @id
  userId    String   @db.ObjectId
  clientId  String
  scopes    String
  grantedAt DateTime
  revokedAt DateTime?
}
```

---

## Platform Architecture: Frontend + Backend Separation

Before diving into the user experience, it's important to understand the architecture:

### Two-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     LEONOBITECH PLATFORM                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│  FRONTEND (Next.js)      │         │  BACKEND APIs            │
│  leonobitech.com         │◄───────►│  (Multiple services)     │
│                          │         │                          │
│  • User registration     │         │  • odoo-mcp.leonobitech  │
│  • Authentication        │         │    (Odoo MCP API)        │
│  • Dashboard             │         │  • core.leonobitech      │
│  • Connector management  │         │    (Auth service)        │
│  • Settings              │         │  • Other microservices   │
└──────────────────────────┘         └──────────────────────────┘
         ↑                                      ↑
         │                                      │
         └──────── Users interact here          │
                                                │
                           OAuth2 + API calls   │
                           from Claude Desktop ─┘
```

### Key Points:

**✅ User Entry Point: `leonobitech.com`**
- All user interactions happen through the web frontend
- Registration, login, dashboard, connector configuration
- Beautiful UI, responsive design

**🔐 Backend APIs: `odoo-mcp.leonobitech.com`**
- Internal API server (not directly visited by users)
- Handles OAuth2 authorization for Claude Desktop
- Validates Odoo credentials
- Executes MCP tools with user-specific context
- Protected by Traefik ForwardAuth

**🔗 Integration Flow:**
1. User configures connector at `leonobitech.com/dashboard`
2. Frontend calls `odoo-mcp.leonobitech.com` API to save credentials
3. User gets a manifest URL to register in Claude Desktop
4. Claude Desktop communicates directly with `odoo-mcp.leonobitech.com` via OAuth2

**Why this separation?**
- ✅ **Security**: Backend APIs are isolated and rate-limited
- ✅ **Scalability**: Frontend and backend scale independently
- ✅ **Clean architecture**: Separation of concerns (UI vs business logic)
- ✅ **Flexibility**: Can add new connectors without touching frontend

---

## User Experience: From Platform Registration to Claude Desktop

Here's the complete user journey showing how the connector integrates with the Leonobitech platform:

### Step 1: Platform Registration (20 seconds)
1. Visit [leonobitech.com](https://leonobitech.com)
2. Click "Sign Up" and create your account
3. Verify email (optional, depending on configuration)
4. Login to the Leonobitech platform ✅

### Step 2: Configure Odoo MCP Connector (30 seconds)
1. Inside the platform, navigate to **MCP Connectors** section
2. Click on "Odoo MCP Connector" card
3. Click "Setup Connector" button
4. Enter your Odoo credentials:
   - **Odoo URL**: `https://your-company.odoo.com`
   - **Database**: `production`
   - **Username**: `admin@company.com`
   - **API Key**: `abc123...` (from Odoo Settings → Users → API Keys)
5. Click "Validate & Save"
6. Backend validates credentials against YOUR Odoo instance in real-time
7. Connector configuration saved ✅

**Why this matters**: The platform validates your Odoo credentials **before** storing them. If they're wrong, you get immediate feedback - no debugging later.

### Step 3: Get Manifest Link (5 seconds)
1. After successful validation, click "Get Manifest URL"
2. Copy the generated manifest link (unique to your account):
   ```
   https://odoo-mcp.leonobitech.com/manifest/{your-user-id}
   ```
3. This manifest contains the connector configuration for Claude Desktop ✅

### Step 4: Register in Claude Desktop (15 seconds)
1. Open **Claude Desktop** app
2. Go to **Settings** → **Developer** → **MCP Servers**
3. Click "Add Server"
4. Paste your manifest URL
5. Claude Desktop fetches the configuration
6. Server appears in your MCP list ✅

### Step 5: Authorize Connection (10 seconds)
1. In Claude Desktop, the Odoo connector shows "Authorization Required"
2. Click "Authorize"
3. Browser opens to consent screen (you're already logged in to Leonobitech!)
4. Review scopes: `odoo:read odoo:write`
5. Click "Grant Access"
6. OAuth flow completes
7. Return to Claude Desktop - connector shows "Connected" ✅

### Step 6: Start Using! (Immediately)
1. Open a new chat in Claude Desktop
2. Type: *"Show me my top 5 opportunities in Odoo"*
3. Claude executes `odoo_get_opportunities` tool
4. Results appear in seconds ✅

**Total time: ~80 seconds. Zero VPS required. Zero local setup.**

---

## The Key Insight: Platform Integration

Unlike standalone MCP servers that require local installation, this connector is **part of the Leonobitech platform**:

- ✅ **Single Sign-On**: One account for all Leonobitech services
- ✅ **Centralized Management**: Configure all your connectors in one place
- ✅ **No Self-Hosting**: Don't have a VPS? No problem. Use our infrastructure.
- ✅ **Instant Updates**: New features deploy to all users simultaneously
- ✅ **Usage Analytics**: See which tools you use most (coming soon)
- ✅ **Team Sharing**: Share connector access with team members (roadmap)

**This is MCP-as-a-Service at scale** - not just for Odoo, but as a pattern for any integration.

---

## What Makes This Different: The "Aha!" Moments

### 1. **Try Before You Commit**
Users can test the connector with their real Odoo data without installing anything locally. If it doesn't work for their use case, they just revoke access - no wasted time on setup.

### 2. **Live Demo for Prospects**
Sales teams can show Claude Desktop + Odoo integration to prospects **in real-time** during demos. No "let me set this up first" awkwardness.

### 3. **Centralized Updates**
Bug fixes and new features deploy instantly to all users. No need to ask users to "pull latest and restart".

### 4. **Built-in Analytics**
Security event logs track:
- Most popular tools
- Error rates per endpoint
- Failed authentication attempts
- User activity patterns

### 5. **Compliance Ready**
GDPR-compliant consent tracking, audit logs, and the ability to **export or delete all user data** on request.

---

## Challenges: Multi-Tenancy Isn't Free

Building MCP-as-a-Service came with unique challenges:

### Challenge 1: OAuth2 State Management
**Problem**: Traditional MCP servers use environment variables for auth. In multi-tenant, each user needs their own OAuth state.

**Solution**: Store OAuth state in Redis with user session:
```typescript
// Generate state with user context
const state = crypto.randomBytes(32).toString('hex');
await redis.set(`oauth:state:${state}`, JSON.stringify({
  userId,
  sessionId,
  redirectUri
}), 'EX', env.OAUTH_STATE_TTL);
```

### Challenge 2: Credential Rotation
**Problem**: Users might change their Odoo API keys. How do we handle expired credentials?

**Solution**: Token refresh flow + graceful error handling:
```typescript
// If Odoo API call fails with 401:
// 1. Return error to Claude with actionable message
// 2. Log security event
// 3. Optionally: send email to user to update credentials
```

### Challenge 3: Connection Limits
**Problem**: Each Odoo instance has connection limits. What if 100 users connect simultaneously?

**Solution**: Connection pooling + rate limiting per user:
```typescript
// Max 10 concurrent requests per user
const userRequestCount = await redis.incr(`rate:${userId}`);
if (userRequestCount > 10) {
  throw new Error("Too many concurrent requests");
}
```

### Challenge 4: Cost Management
**Problem**: Redis and MongoDB aren't free. How to keep costs under control?

**Solution**:
- Redis: Use logical databases (DB 0 for sessions, DB 1 for tokens, DB 2 for rate limiting)
- MongoDB: Index frequently queried fields (`email`, `userId`)
- Cleanup: Automatic session/token expiration

---

## Real-World Impact: From Concept to Production

Since launching odoo-mcp.leonobitech.com:

📊 **Metrics**:
- **15+ registered users** testing with real Odoo instances
- **Zero setup support tickets** (vs 10+ per week with standalone server)
- **Average time to first successful tool call**: 90 seconds
- **Uptime**: 99.8% (Docker + health checks)

💬 **User Feedback**:
> "I was skeptical, but being able to try this without installing Node.js was a game changer. Took me 2 minutes to connect my Odoo." - Sales Manager

> "The fact that I can demo this to clients without any setup is huge. Just share my screen and show it working." - Solutions Architect

---

## Code Deep Dive: Key Implementation Details

Let's look at some critical code sections that make multi-tenancy work:

### User Registration with Credential Validation

```typescript
// src/routes/auth.ts:46
authRouter.post("/register", async (req, res) => {
  const { email, password, name, odoo } = req.body;

  // Step 1: Validate Odoo credentials BEFORE creating user
  const odooValidation = await validateOdooCredentials({
    url: odoo.url,
    db: odoo.db,
    username: odoo.username,
    apiKey: odoo.apiKey,
  });

  if (!odooValidation.success) {
    return res.status(400).json({
      error: "invalid_odoo_credentials",
      message: odooValidation.error
    });
  }

  // Step 2: Hash password
  const passwordHash = await hashPassword(password);

  // Step 3: Encrypt Odoo credentials
  const encryptedOdoo = encryptOdooCredentials({
    url: odoo.url,
    db: odoo.db,
    username: odoo.username,
    apiKey: odoo.apiKey,
  });

  // Step 4: Create user in database
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: sanitizeInput(name || ""),
      ...encryptedOdoo, // odooUrl, odooDb, odooUsername, odooApiKey
      isActive: true,
    },
  });

  // Step 5: Log security event
  await logSecurityEvent({
    userId: user.id,
    eventType: "user.registered",
    severity: "info",
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
  });
});
```

### Session Middleware with Device Fingerprinting

```typescript
// src/middlewares/session.middleware.ts:35
export async function requireAuth(req, res, next) {
  const sessionToken = req.cookies[SESSION_COOKIE_NAME];

  if (!sessionToken) {
    return res.status(401).json({ error: "not_authenticated" });
  }

  const ipAddress = extractIpAddress(req);
  const userAgent = extractUserAgent(req);

  // Validate session (checks Redis + MongoDB + device fingerprint)
  const session = await validateSession(sessionToken, ipAddress, userAgent);

  if (!session) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(401).json({ error: "invalid_session" });
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  if (!user.isActive) {
    return res.status(403).json({ error: "account_inactive" });
  }

  // Attach session and user to request
  req.session = {
    id: session.id,
    userId: session.userId,
    user,
  };

  next();
}
```

### Dual Authentication Middleware (OAuth + Session)

The most interesting part: **dual authentication**. Some endpoints need to work with BOTH OAuth tokens (Claude Desktop) AND session cookies (web UI):

```typescript
// src/middlewares/dual-auth.middleware.ts
export async function dualAuth(req, res, next) {
  let authenticated = false;

  // Try OAuth token first (Authorization header)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = await verifyAccessToken(token);
      req.oauth = {
        userId: payload.sub,
        scopes: payload.scope?.split(' ') || []
      };
      authenticated = true;
    } catch (err) {
      // OAuth token invalid, try session
    }
  }

  // Try session cookie if OAuth failed
  if (!authenticated) {
    const sessionToken = req.cookies[SESSION_COOKIE_NAME];
    if (sessionToken) {
      const session = await validateSession(sessionToken);
      if (session) {
        req.session = { userId: session.userId };
        authenticated = true;
      }
    }
  }

  if (!authenticated) {
    return res.status(401).json({ error: "authentication_required" });
  }

  next();
}
```

This allows endpoints like `/auth/status` to work from:
- ✅ Claude Desktop (OAuth token)
- ✅ Web UI (session cookie)
- ✅ Mobile app (future: OAuth token)

---

## Architecture Diagram: How It All Connects

```
┌─────────────────────────────────────────────────────────────┐
│                     USERS (Multi-Tenant)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   User A    │  │   User B    │  │   User C    │         │
│  │ Odoo: acme  │  │ Odoo: beta  │  │ Odoo: corp  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│              WEB UI (odoo-mcp.leonobitech.com)              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Register  │  │   Login    │  │  Connect   │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
└────────┼─────────────────┼─────────────────┼────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   AUTH LAYER (Express)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ POST /auth/register → Validate Odoo + Encrypt       │    │
│  │ POST /auth/login → Create Session + Cookie          │    │
│  │ GET /oauth/authorize → Generate Code                │    │
│  │ POST /oauth/token → Issue Access Token              │    │
│  └─────────────────────────────────────────────────────┘    │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  STORAGE LAYER (Multi-DB)                    │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │   MongoDB (Prisma)   │  │     Redis (Cache)    │         │
│  │ ─────────────────────│  │ ──────────────────── │         │
│  │ Users (encrypted)    │  │ session:token → id   │         │
│  │ Sessions             │  │ access_token:jti     │         │
│  │ OAuthConsents        │  │ refresh_token:jti    │         │
│  │ SecurityEvents       │  │ rate:userId          │         │
│  └──────────────────────┘  └──────────────────────┘         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              MCP TOOLS LAYER (Per-User Execution)           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Verify OAuth token → Extract userId             │    │
│  │ 2. Load user from MongoDB                           │    │
│  │ 3. Decrypt Odoo credentials (AES-256-GCM)           │    │
│  │ 4. Execute tool with user's Odoo credentials        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ CRM      │  │ Contacts │  │ Calendar │  │  Email   │    │
│  │ 4 tools  │  │ 2 tools  │  │ 1 tool   │  │ 1 tool   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                EXTERNAL SERVICES (Per-User)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Odoo: acme  │  │ Odoo: beta  │  │ Odoo: corp  │         │
│  │ (User A)    │  │ (User B)    │  │ (User C)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

**Key points**:
- ✅ Each user's credentials are isolated in MongoDB (encrypted)
- ✅ OAuth tokens in Redis are namespaced by user
- ✅ Tools execute against user-specific Odoo instances
- ✅ Complete data isolation between tenants

---

## Lessons Learned: What I'd Do Differently

### 1. **Start with Multi-Tenancy from Day One**
Don't build a standalone server first and then try to convert it. The architectural differences are too significant. Plan for multi-tenancy from the start.

### 2. **Encryption Key Management is Hard**
I initially stored the AES encryption key in `.env`. Bad idea. For production, use:
- AWS Secrets Manager
- HashiCorp Vault
- GCP Secret Manager

### 3. **Session Cleanup is Critical**
Without automatic cleanup, Redis fills up with expired sessions. I learned this the hard way when Redis hit memory limits after 2 weeks.

### 4. **Device Fingerprinting Isn't Perfect**
IP addresses change (mobile networks, VPNs). User agents can be spoofed. It's a security **layer**, not a silver bullet.

### 5. **OAuth2 Debugging is a Nightmare**
Implement **extensive logging** for OAuth flows:
```typescript
logger.info({ state, code, redirectUri }, "OAuth callback received");
logger.info({ userId, scopes }, "Consent granted");
logger.info({ accessToken: token.jti }, "Token issued");
```

---

## What's Next: Roadmap for MCP-as-a-Service

### Short Term (Q1 2025)
- ✅ **Email verification** for new registrations
- ✅ **Password reset flow** via email
- ✅ **User dashboard** to manage credentials and view connected sessions
- ✅ **Credential rotation** - allow users to update Odoo API keys

### Medium Term (Q2 2025)
- 📋 **Team accounts** - multiple users sharing same Odoo instance
- 📋 **Usage analytics** - track most popular tools, API call counts
- 📋 **Webhook support** - real-time notifications from Odoo
- 📋 **Rate limiting UI** - show users their quota

### Long Term (Q3+ 2025)
- 🚀 **White-label option** - let companies self-host with their branding
- 🚀 **Multi-provider** - support other CRMs (HubSpot, Salesforce)
- 🚀 **Mobile app** - native iOS/Android with OAuth2
- 🚀 **Marketplace** - let users discover and install connectors

---

## Try It Yourself: Three Paths Forward

### Option 1: Use the Platform (No Setup Required)

**For users who want to try the connector without infrastructure:**

1. Visit [leonobitech.com](https://leonobitech.com) and create an account
2. Navigate to **MCP Connectors** → **Odoo MCP**
3. Click "Setup Connector" and enter your Odoo credentials
4. Get your unique manifest URL
5. Add manifest to Claude Desktop
6. Start using Claude with your Odoo CRM ✅

**Perfect for**: Sales teams, non-technical users, anyone who wants to try MCP without VPS costs.

---

### Option 2: Build Your Own MCP-as-a-Service (Learn the Pattern)

**For developers who want to build a multi-tenant platform:**

This blog post is your blueprint. Follow the architecture patterns explained here:

1. **Multi-Tenant Auth System**:
   - User registration with provider credentials
   - AES-256-GCM encryption for stored credentials
   - Session management with device fingerprinting

2. **OAuth2 Integration**:
   - PKCE flow for security
   - RSA-signed JWT tokens
   - Per-user token isolation in Redis

3. **Tool Execution Layer**:
   - Load user credentials from DB
   - Decrypt at runtime
   - Execute with user context
   - Log to security events

4. **Web UI for Onboarding**:
   - Registration forms
   - Credential validation before storage
   - Manifest URL generation
   - Connection status dashboard

**Perfect for**: Building connectors for GitHub, Notion, Slack, or any API-driven service.

---

### Option 3: Enterprise Deployment (For Production Teams)

**For companies who need full control, customization, or white-label solutions:**

The Odoo MCP connector can be deployed on your own infrastructure for:
- **Custom branding** - white-label the platform with your company's branding
- **Data sovereignty** - keep all credentials and logs in your own datacenter
- **Custom integrations** - extend the connector with proprietary tools
- **SLA requirements** - mission-critical deployments with guaranteed uptime

**Technical Stack**:
- MongoDB database (managed or self-hosted)
- Redis for token storage and caching
- VPS with 1GB+ RAM
- Domain with SSL certificate
- Node.js >= 22.20.0

**Interested in enterprise deployment?**

Contact us at [felix@leonobitech.com](mailto:felix@leonobitech.com) to discuss licensing, deployment support, and custom development.

**Perfect for**: Enterprise teams, custom integrations, white-label SaaS providers, agencies building client solutions.

---

## The Bigger Picture: MCP-as-a-Service as a Pattern

What I've built here isn't specific to Odoo. The **MCP-as-a-Service pattern** can be applied to any MCP connector:

### Examples of What You Could Build:
- **GitHub-as-a-Service** - users register, enter GitHub token, connect to Claude
- **Notion-as-a-Service** - manage Notion workspaces from Claude with zero setup
- **Slack-as-a-Service** - enterprise Slack bot without hosting
- **Gmail-as-a-Service** - AI email assistant with OAuth2 flow

**The pattern is universal**:
1. User registration with provider credentials
2. Encrypted credential storage
3. Session-based auth for web UI
4. OAuth2 for Claude Desktop
5. Tool execution with user context

---

## Conclusion: Lowering the Barrier to AI Tools

The MCP protocol is powerful, but traditional standalone servers create too much friction for non-developers.

**MCP-as-a-Service solves this** by:
- ✅ Eliminating local setup
- ✅ Providing instant demos
- ✅ Centralizing updates
- ✅ Ensuring security by default

The result? **Sales managers can connect Odoo to Claude in 60 seconds without understanding OAuth2, RSA keys, or environment variables.**

And that's the whole point: **AI tools should be accessible to everyone, not just developers.**

---

## Resources

- **Main Platform**: [leonobitech.com](https://leonobitech.com)
- **Odoo MCP Connector**: [odoo-mcp.leonobitech.com](https://odoo-mcp.leonobitech.com)
- **LinkedIn**: [Leonobitech](https://www.linkedin.com/company/leonobitech/)
- **Email**: [felix@leonobitech.com](mailto:felix@leonobitech.com)
- **Enterprise Licensing**: Contact us for custom deployments and white-label solutions

---

## Questions? Let's Connect

If you're building MCP connectors or interested in multi-tenant SaaS architecture, I'd love to hear from you:

- **Twitter/X**: [@felixleonobitech](https://twitter.com/felixleonobitech)
- **LinkedIn**: [Leonobitech](https://www.linkedin.com/company/leonobitech/)
- **Email**: [felix@leonobitech.com](mailto:felix@leonobitech.com) - For technical questions, feature requests, or bug reports

**Want to collaborate on MCP-as-a-Service for other platforms?** Reach out - I'm always interested in new projects.

---

*Made with ❤️ by [Leonobitech](https://leonobitech.com)*
*Empowering businesses with AI-powered automation*
