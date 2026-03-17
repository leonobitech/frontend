"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { startRegistration } from "@simplewebauthn/browser";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Smartphone, Shield, AlertCircle, HelpCircle } from "lucide-react";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import Link from "next/link";

function SetupPasskeyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [screenResolution, setScreenResolution] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyName, setPasskeyName] = useState<string>("");

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

  const handleSetupPasskey = async () => {
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

      // Step 1: Get setup challenge
      const challengeResponse = await fetch("/api/passkey/setup/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, meta }),
      });

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json();
        throw new Error(errorData.message || "Failed to get setup challenge");
      }

      const { options } = await challengeResponse.json();

      // Step 2: Create passkey using WebAuthn
      const credential = await startRegistration({ optionsJSON: options });

      // Step 3: Verify and complete setup
      const verifyResponse = await fetch("/api/passkey/setup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingToken,
          credential,
          name: passkeyName.trim() || undefined, // Send name if provided
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

      toast.success("Passkey configured successfully!", {
        description: "You can now use your phone to login securely.",
        icon: "🔐",
      });

      // Hard redirect to ensure new cookies are read
      window.location.href = "/dashboard";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to setup passkey";

      // Handle specific WebAuthn errors
      if (message.includes("NotAllowedError") || message.includes("cancelled")) {
        setError("Passkey creation was cancelled. Please try again.");
      } else if (message.includes("InvalidStateError")) {
        setError("A passkey already exists for this device.");
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
        <div className="mx-auto mb-4 w-16 h-16 bg-[#3A3A3A] dark:bg-[#D1D5DB] rounded-full flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Setup Your Passkey</CardTitle>
        <CardDescription>
          Configure your phone as a secure authentication method.
          This is required to complete your login.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {email && (
          <div className="text-center text-sm text-muted-foreground">
            Setting up passkey for <strong>{email}</strong>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-[#3A3A3A] dark:text-[#D1D5DB] shrink-0 mt-0.5" />
            <div className="text-sm text-gray-800 dark:text-gray-200">
              <p className="font-medium mb-1">Why do I need a passkey?</p>
              <p className="text-[#3A3A3A] dark:text-[#D1D5DB]">
                Passkeys provide an extra layer of security by using your phone&apos;s
                biometrics (Face ID, fingerprint) instead of passwords.
              </p>
            </div>
          </div>
        </div>

        {/* Passkey Name Input */}
        <div className="space-y-2">
          <Label htmlFor="passkeyName">Passkey Name</Label>
          <Input
            id="passkeyName"
            type="text"
            value={passkeyName}
            onChange={(e) => setPasskeyName(e.target.value)}
            placeholder="e.g., My iPhone, Work Phone"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            Give your passkey a name to identify it later (optional)
          </p>
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

        {/* Setup Button */}
        <Button
          onClick={handleSetupPasskey}
          disabled={isLoading}
          className="w-full bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15"
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner className="w-4 h-4" />
              Setting up passkey...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Setup Passkey with Phone
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

export default function SetupPasskeyPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Spinner className="w-8 h-8" />
          </div>
        }
      >
        <SetupPasskeyForm />
      </Suspense>
    </div>
  );
}
