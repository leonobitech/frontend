---
title: "Building MCP-as-a-Service: From Standalone Server to Multi-Tenant SaaS Platform"
excerpt: "How I transformed a traditional MCP server into a production-ready multi-tenant SaaS platform where users can connect their Odoo CRM to Claude Desktop without any local setup. No npm install, no config files, just register and go."
date: "2025-01-19"
author: "Felix León"
tags: ["MCP", "Odoo", "Multi-Tenancy", "SaaS", "OAuth2", "TypeScript", "Architecture"]
coverImage: "/blog/mcp-as-a-service.png"
---

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

That's exactly what I built with [odoo-mcp.leonobitech.com](https://odoo-mcp.leonobitech.com) - a multi-tenant SaaS platform where anyone can connect their Odoo CRM to Claude Desktop in under 60 seconds.

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
✅ **Web-based onboarding** - register at [odoo-mcp.leonobitech.com](https://odoo-mcp.leonobitech.com)
✅ **Live demo** - see it working immediately after registration
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

---

## Architecture: Multi-Tenancy from Day One

Building a multi-tenant MCP server required rethinking the entire architecture. Here's how it works:

### 1. User Registration with Credential Validation

Users register at `odoo-mcp.leonobitech.com/register` with:
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

## Security: Defense in Depth

Multi-tenant SaaS requires **paranoid security**. Here's what I implemented:

### 1. Rate Limiting
```typescript
// src/routes/auth.ts:52
const rateLimited = await isRateLimited(
  ipAddress,
  "user.registered",
  3, // Max 3 registrations
  60 // per hour
);
```

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
}), 'EX', 600); // 10 min TTL
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
- **LinkedIn**: [Felix León](https://www.linkedin.com/in/felix-leonobitech)
- **Email**: [felix@leonobitech.com](mailto:felix@leonobitech.com)
- **Enterprise Licensing**: Contact us for custom deployments and white-label solutions

---

## Questions? Let's Connect

If you're building MCP connectors or interested in multi-tenant SaaS architecture, I'd love to hear from you:

- **Twitter/X**: [@felixleonobitech](https://twitter.com/felixleonobitech)
- **LinkedIn**: [Felix León](https://www.linkedin.com/in/felix-leonobitech)
- **Email**: [felix@leonobitech.com](mailto:felix@leonobitech.com) - For technical questions, feature requests, or bug reports

**Want to collaborate on MCP-as-a-Service for other platforms?** Reach out - I'm always interested in new projects.

---

*Made with ❤️ by [Leonobitech](https://leonobitech.com)*
*Empowering businesses with AI-powered automation*
