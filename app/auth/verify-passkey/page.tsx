"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { startAuthentication } from "@simplewebauthn/browser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Fingerprint, Shield, AlertCircle, HelpCircle } from "lucide-react";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import Link from "next/link";

function VerifyPasskeyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [screenResolution, setScreenResolution] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  // Get pending token and email from URL or sessionStorage
  useEffect(() => {
    const token = searchParams.get("token");
    const storedToken = sessionStorage.getItem("passkeyPendingToken");
    const storedEmail = sessionStorage.getItem("passkeyPendingEmail");

    if (token) {
      setPendingToken(token);
    } else if (storedToken) {
      setPendingToken(storedToken);
    } else {
      // No token, redirect to login
      router.replace("/login");
      return;
    }

    if (storedEmail) {
      setEmail(storedEmail);
    }

    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, [searchParams, router]);

  // Auto-start verification when component mounts
  useEffect(() => {
    if (pendingToken && screenResolution && !autoStarted) {
      setAutoStarted(true);
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleVerifyPasskey();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingToken, screenResolution, autoStarted]);

  const handleVerifyPasskey = async () => {
    if (!pendingToken) {
      toast.error("Session expired. Please login again.");
      router.replace("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const meta = buildClientMetaWithResolution(screenResolution, {
        label: "leonobitech",
      });

      // Step 1: Get 2FA challenge
      const challengeResponse = await fetch("/api/passkey/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, meta }),
      });

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json();
        throw new Error(errorData.message || "Failed to get verification challenge");
      }

      const { options } = await challengeResponse.json();

      // Step 2: Authenticate with passkey
      const credential = await startAuthentication({ optionsJSON: options });

      // Step 3: Verify and complete login
      const verifyResponse = await fetch("/api/passkey/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingToken,
          credential,
          meta,
        }),
        credentials: "include",
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || "Failed to verify passkey");
      }

      // Success - clear session storage
      sessionStorage.removeItem("passkeyPendingToken");
      sessionStorage.removeItem("passkeyPendingEmail");

      toast.success("Welcome back!", {
        description: "Successfully verified with your passkey.",
        icon: "🔐",
      });

      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify passkey";

      // Handle specific WebAuthn errors
      if (message.includes("NotAllowedError") || message.includes("cancelled")) {
        setError("Verification was cancelled. Click the button to try again.");
      } else if (message.includes("NotFoundError")) {
        setError("No matching passkey found. Try recovery if you lost access to your phone.");
      } else if (message.includes("expired") || message.includes("Expired")) {
        toast.error("Session expired. Please login again.");
        sessionStorage.removeItem("passkeyPendingToken");
        sessionStorage.removeItem("passkeyPendingEmail");
        router.replace("/login");
        return;
      } else {
        setError(message);
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = () => {
    // Store token for recovery flow
    if (pendingToken) {
      sessionStorage.setItem("passkeyPendingToken", pendingToken);
    }
    router.push("/auth/recover-passkey");
  };

  if (!pendingToken) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-linear-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
          <Fingerprint className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Verify Your Identity</CardTitle>
        <CardDescription>
          Use your registered passkey to complete the login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {email && (
          <div className="text-center text-sm text-muted-foreground">
            Verifying <strong>{email}</strong>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="text-sm text-purple-800 dark:text-purple-200">
              <p className="font-medium mb-1">Secure Verification</p>
              <p className="text-purple-600 dark:text-purple-300">
                Use your phone&apos;s biometrics (Face ID, fingerprint) to verify your identity.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Verify Button */}
        <Button
          onClick={handleVerifyPasskey}
          disabled={isLoading}
          className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner className="w-4 h-4" />
              Verifying...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5" />
              Verify with Passkey
            </span>
          )}
        </Button>

        {/* Help Link */}
        <div className="border-t pt-4">
          <button
            onClick={handleRecovery}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Lost access to your phone? Recover via email
          </button>
        </div>

        {/* Cancel Link */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              sessionStorage.removeItem("passkeyPendingToken");
              sessionStorage.removeItem("passkeyPendingEmail");
            }}
          >
            Cancel and return to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyPasskeyPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Spinner className="w-8 h-8" />
          </div>
        }
      >
        <VerifyPasskeyForm />
      </Suspense>
    </div>
  );
}
