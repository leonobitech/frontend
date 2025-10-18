"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Check, X, AlertCircle } from "lucide-react";
import { useSession } from "@/app/context/SessionContext";

interface OAuthParams {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state?: string;
  code_challenge: string;
  code_challenge_method: string;
  nonce?: string;
  login_hint?: string;
}

export default function AuthorizeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, user, loading } = useSession();

  const [error, setError] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  // Parse OAuth parameters
  const oauthParams: OAuthParams | null = searchParams ? {
    client_id: searchParams.get("client_id") || "",
    redirect_uri: searchParams.get("redirect_uri") || "",
    response_type: searchParams.get("response_type") || "code",
    scope: searchParams.get("scope") || "",
    state: searchParams.get("state") || undefined,
    code_challenge: searchParams.get("code_challenge") || "",
    code_challenge_method: searchParams.get("code_challenge_method") || "S256",
    nonce: searchParams.get("nonce") || undefined,
    login_hint: searchParams.get("login_hint") || undefined,
  } : null;

  // Validate parameters
  useEffect(() => {
    if (!oauthParams) return;

    if (!oauthParams.client_id) {
      setError("Missing client_id parameter");
      return;
    }

    if (!oauthParams.redirect_uri) {
      setError("Missing redirect_uri parameter");
      return;
    }

    if (!oauthParams.code_challenge) {
      setError("Missing code_challenge parameter (PKCE required)");
      return;
    }

    if (!oauthParams.scope) {
      setError("Missing scope parameter");
      return;
    }
  }, [oauthParams]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      // Save current URL to return after login
      const returnUrl = window.location.href;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [session, loading, router]);

  const handleAuthorize = async () => {
    if (!oauthParams) return;

    setAuthorizing(true);
    setError(null);

    try {
      // Call backend OAuth authorize endpoint with user's session
      const params = new URLSearchParams({
        client_id: oauthParams.client_id,
        redirect_uri: oauthParams.redirect_uri,
        response_type: oauthParams.response_type,
        scope: oauthParams.scope,
        code_challenge: oauthParams.code_challenge,
        code_challenge_method: oauthParams.code_challenge_method,
        ...(oauthParams.state && { state: oauthParams.state }),
        ...(oauthParams.nonce && { nonce: oauthParams.nonce }),
        // Use logged-in user's email as login_hint
        login_hint: user?.email || "authorized-user",
      });

      // Backend will redirect to redirect_uri with authorization code
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth/authorize?${params.toString()}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to authorize");
      setAuthorizing(false);
    }
  };

  const handleDeny = () => {
    if (!oauthParams?.redirect_uri) return;

    // Redirect back with error
    const url = new URL(oauthParams.redirect_uri);
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("error_description", "User denied authorization");
    if (oauthParams.state) {
      url.searchParams.set("state", oauthParams.state);
    }

    window.location.href = url.toString();
  };

  // Parse scopes
  const scopes = oauthParams?.scope.split(" ").filter(Boolean) || [];

  // Map scopes to human-readable permissions
  const scopeDescriptions: Record<string, { icon: string; description: string }> = {
    "odoo:read": {
      icon: "📖",
      description: "Read data from your Odoo CRM (leads, contacts, opportunities)"
    },
    "odoo:write": {
      icon: "✏️",
      description: "Create and modify data in your Odoo CRM"
    },
    "odoo:calendar": {
      icon: "📅",
      description: "Manage your Odoo calendar events and meetings"
    },
    "odoo:email": {
      icon: "📧",
      description: "Send emails through your Odoo account"
    },
  };

  // Get client name (could be fetched from backend)
  const clientName = "Claude Desktop";

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-red-500/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <CardTitle>Authorization Error</CardTitle>
              <CardDescription>Unable to process authorization request</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => router.push("/")} className="w-full">
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!oauthParams) {
    return null;
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Authorize Access</CardTitle>
            <CardDescription className="text-base">
              {clientName} wants to access your account
            </CardDescription>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Client</span>
            <span className="font-medium">{clientName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your account</span>
            <span className="font-medium">{user?.email}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Permissions */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>Requested Permissions</span>
            <Badge variant="secondary" className="text-xs">
              {scopes.length} {scopes.length === 1 ? "scope" : "scopes"}
            </Badge>
          </h3>
          <div className="space-y-2">
            {scopes.map((scope) => {
              const info = scopeDescriptions[scope] || {
                icon: "🔑",
                description: scope
              };
              return (
                <div
                  key={scope}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <span className="text-xl flex-shrink-0">{info.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{info.description}</p>
                    <code className="text-xs text-muted-foreground">{scope}</code>
                  </div>
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Info */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This connection uses OAuth 2.0 with PKCE for secure authorization.
            You can revoke access anytime from your account settings.
          </AlertDescription>
        </Alert>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleDeny}
          disabled={authorizing}
          className="flex-1"
        >
          <X className="mr-2 h-4 w-4" />
          Deny
        </Button>
        <Button
          onClick={handleAuthorize}
          disabled={authorizing}
          className="flex-1"
        >
          {authorizing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Authorizing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Authorize
            </>
          )}
        </Button>
      </CardFooter>

      {/* Footer Info */}
      <div className="px-6 pb-6">
        <p className="text-xs text-center text-muted-foreground">
          By authorizing, you allow {clientName} to access your Odoo data within the requested scopes.
        </p>
      </div>
    </Card>
  );
}
