"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Mail, Shield, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { OtpInput } from "@/components/OtpInput";
import Link from "next/link";

function RecoverPasskeyForm() {
  const router = useRouter();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  // Get pending token from sessionStorage
  useEffect(() => {
    const storedToken = sessionStorage.getItem("passkeyPendingToken");

    if (!storedToken) {
      router.replace("/login");
      return;
    }

    setPendingToken(storedToken);
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleRequestRecovery = async () => {
    if (!pendingToken) {
      toast.error("Session expired. Please login again.");
      router.replace("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/passkey/recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to request recovery");
      }

      setRequestId(data.requestId);
      setMaskedEmail(data.email);
      setExpiresIn(data.expiresIn);
      setSecondsLeft(data.expiresIn);
      setStep("verify");

      toast.success("Recovery code sent!", {
        description: `Check your email at ${data.email}`,
        icon: "📧",
      });

      // Focus on first OTP input
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request recovery";

      if (message.includes("expired") || message.includes("Expired")) {
        toast.error("Session expired. Please login again.");
        sessionStorage.removeItem("passkeyPendingToken");
        router.replace("/login");
        return;
      }

      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (otpCode: string) => {
    if (!requestId) {
      toast.error("Recovery request not found. Please try again.");
      setStep("request");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/passkey/recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, code: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to verify recovery code");
      }

      // Store the new pending token for setup
      sessionStorage.setItem("passkeyPendingToken", data.pendingToken);
      sessionStorage.setItem("passkeyPendingEmail", data.email);

      toast.success("Recovery verified!", {
        description: "Now set up a new passkey for your phone.",
        icon: "✅",
      });

      // Redirect to setup page
      router.push("/auth/setup-passkey");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify code";

      if (message.includes("expired") || message.includes("Expired")) {
        setError("Code expired. Please request a new one.");
        setCode("");
      } else if (message.includes("Invalid") || message.includes("invalid")) {
        setError("Invalid code. Please check and try again.");
        setCode("");
      } else {
        setError(message);
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setStep("request");
    setRequestId(null);
    setCode("");
    setError(null);
    await handleRequestRecovery();
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
          <Mail className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">
          {step === "request" ? "Recover Access" : "Enter Recovery Code"}
        </CardTitle>
        <CardDescription>
          {step === "request"
            ? "Lost access to your phone? We'll send a recovery code to your email."
            : `Enter the 6-digit code sent to ${maskedEmail}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "request" ? (
          <>
            {/* Info Box */}
            <div className="bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-[#3A3A3A] dark:text-[#D1D5DB] shrink-0 mt-0.5" />
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  <p className="font-medium mb-1">Account Recovery</p>
                  <p className="text-[#3A3A3A] dark:text-[#D1D5DB]">
                    This will send a one-time code to your registered email address.
                    Your existing passkeys will be removed so you can set up a new one.
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

            {/* Request Button */}
            <Button
              onClick={handleRequestRecovery}
              disabled={isLoading}
              className="w-full bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Sending code...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Send Recovery Code
                </span>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* OTP Input */}
            <div className="space-y-4">
              <OtpInput
                length={6}
                firstInputRef={firstInputRef}
                onComplete={(otpCode) => {
                  setCode(otpCode);
                  handleVerifyCode(otpCode);
                }}
              />

              {/* Timer */}
              <p className="text-center text-sm text-muted-foreground">
                {secondsLeft > 0 ? (
                  <>Code expires in <strong>{secondsLeft}</strong> seconds</>
                ) : (
                  <span className="text-red-500">Code expired</span>
                )}
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

            {/* Verify Button */}
            <Button
              onClick={() => code.length === 6 && handleVerifyCode(code)}
              disabled={isLoading || code.length !== 6}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </Button>

            {/* Resend Button */}
            <Button
              variant="outline"
              onClick={handleResendCode}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend Code
            </Button>
          </>
        )}

        {/* Back Link */}
        <div className="border-t pt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              sessionStorage.removeItem("passkeyPendingToken");
              sessionStorage.removeItem("passkeyPendingEmail");
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RecoverPasskeyPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Spinner className="w-8 h-8" />
          </div>
        }
      >
        <RecoverPasskeyForm />
      </Suspense>
    </div>
  );
}
