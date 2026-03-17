"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Mail } from "lucide-react";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required")
    .email("Invalid email format"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [screenResolution, setScreenResolution] = useState("");

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/password/forgot:${requestId}`;

      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({ ...data, meta }),
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result?.message || "Failed to send reset code");
        return;
      }

      setIsSuccess(true);
      toast.success("Check your email", {
        description:
          "If an account exists, you'll receive a 6-digit code shortly.",
        icon: "📧",
      });

      // Guardar email en sessionStorage (patrón consistente con register/login)
      sessionStorage.setItem("pendingVerificationEmail", data.email);

      // Redirigir a verify-email con source=password (patrón existente)
      setTimeout(() => {
        router.push(
          `/verify-email?token=${result.data.requestId}&expiresIn=${result.data.expiresIn}&source=password`
        );
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md custom-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              If we find an account for
              {" "}
              <span className="font-medium text-foreground">
                {getValues("email")}
              </span>
              , we&apos;ll send a 6-digit verification code.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Codes expire in 5 minutes. If nothing arrives, check spam or
              try again.
            </p>
            <Button
              onClick={() => router.push(`/verify-email?source=password`)}
              className="w-full"
            >
              Continue to Verify Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md custom-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="relative w-14 h-14">
              <Image
                src="/icon_512x512.png"
                alt="icon"
                fill
                sizes="56px"
                className="object-contain"
                priority
              />
            </div>
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a code to reset your
            password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <fieldset disabled={isSubmitting} className="space-y-4">
              {/* Email Field */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "error-email" : undefined}
                />
                {errors.email && (
                  <p
                    id="error-email"
                    role="alert"
                    className="mt-1 text-red-500 text-sm"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="w-4 h-4 animate-spin" />
                    Sending code...
                  </span>
                ) : (
                  "Send Reset Code"
                )}
              </Button>
            </fieldset>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
