"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { buildClientMetaWithResolution, RequestMeta } from "@/lib/clientMeta";
import { useQueryClient } from "@tanstack/react-query";
import { OtpInput } from "@/components/OtpInput";
import { Eye, EyeOff } from "lucide-react";

const verifySchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});
type VerifyForm = z.infer<typeof verifySchema>;

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/\d/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function VerifyEmailForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 🔐 Protección contra acceso sin contexto
  useEffect(() => {
    const email = sessionStorage.getItem("pendingVerificationEmail");
    const token = new URLSearchParams(window.location.search).get("token");

    if (!email || !token) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [email, setEmail] = useState("");
  const [screenResolution, setScreenResolution] = useState("");
  const [requestId, setRequestId] = useState("");
  const [flowSource, setFlowSource] = useState<"email" | "device" | "password">("email");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setFocus,
    setValue,
    reset,
    trigger,
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    mode: "onBlur",
  });

  const passwordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  // Obtener token y expiración de la URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || "";
    const expiresIn = Number(params.get("expiresIn") || "0");
    const source = params.get("source") || "email";

    setRequestId(token);
    setFlowSource(source === "password" ? "password" : source === "device" ? "device" : "email");

    if (expiresIn > 0) {
      setExpiresAt(new Date(Date.now() + expiresIn * 1000));
    }
    firstInputRef.current?.focus();
  }, []);

  // Cargar email pendiente
  useEffect(() => {
    const stored = sessionStorage.getItem("pendingVerificationEmail");
    if (stored) setEmail(stored);
  }, []);

  // Capturar resolución de pantalla
  useEffect(() => {
    if (typeof window === "undefined") return;
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // Countdown
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      setSecondsLeft(
        Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const onError = (errs: typeof errors) => {
    const field = Object.keys(errs)[0] as keyof VerifyForm;
    setFocus(field);
  };

  const onSubmit = async (data: VerifyForm) => {
    if (!email || !requestId) {
      toast.error("Faltan datos para verificar.");
      return;
    }
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Email inválido.");
      return;
    }

    const meta: RequestMeta = {
      ...buildClientMetaWithResolution(screenResolution, {
        label: "leonobitech",
      }),
    };

    // Si es flujo de password reset, solo verificamos el código y mostramos el formulario de contraseña
    if (flowSource === "password") {
      // Guardar el código verificado temporalmente
      setVerifiedCode(data.code);
      setCodeVerified(true);
      toast.success("Code verified! Now enter your new password.");
      return;
    }

    // Flujo normal de email/device verification
    try {
      const verifyRequestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/verify-email:${verifyRequestId}`;

      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": verifyRequestId,
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({
          email: parsed.data,
          code: data.code,
          requestId,
          meta,
        }),
      });
      const result = await res.json();

      // Flujo de reenvío
      if (result?.resend) {
        toast.success(result.message || "Código re-enviado.");
        if (result.requestId && result.expiresIn) {
          setRequestId(result.requestId);
          setExpiresAt(new Date(Date.now() + result.expiresIn * 1000));
          reset({ code: "" });
          firstInputRef.current?.focus();
          const url = new URL(window.location.href);
          url.searchParams.set("token", result.requestId);
          url.searchParams.set("expiresIn", result.expiresIn.toString());
          window.history.replaceState({}, "", url.toString());
        }
        return;
      }

      if (!res.ok) throw new Error(result.message);
      if (result.alreadyVerified) {
        toast("Ya habías verificado anteriormente", {
          icon: "ℹ️",
          duration: 3000,
        });
      }
      sessionStorage.removeItem("pendingVerificationEmail");
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success(result.message);
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    }
  };

  const onResetPasswordSubmit = async (data: ResetPasswordForm) => {
    if (!email || !requestId || !verifiedCode) {
      toast.error("Missing verification data");
      return;
    }

    try {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const resetRequestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/password/reset:${resetRequestId}`;

      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": resetRequestId,
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({
          email,
          code: verifiedCode,
          newPassword: data.newPassword,
          requestId,
          meta,
        }),
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        // Si el código expiró, se reenvía automáticamente
        if (result.resend) {
          toast.warning("Code expired", {
            description: "A new code has been sent to your email",
            icon: "🔁",
          });
          setRequestId(result.requestId);
          setCodeVerified(false);
          setVerifiedCode("");
          passwordForm.reset();
          return;
        }

        toast.error(result?.message || "Failed to reset password");
        return;
      }

      toast.success("Password reset successful!", {
        description: "You're now logged in with your new password",
        icon: "✅",
      });

      // Limpiar sessionStorage
      sessionStorage.removeItem("pendingVerificationEmail");

      // Invalidar query de sesión y redirigir
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
    }
  };

  // Si el código fue verificado y estamos en flujo de password, mostrar formulario de contraseña
  if (codeVerified && flowSource === "password") {
    return (
      <>
        <CardHeader>
          <CardTitle>Set New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(onResetPasswordSubmit)}
            className="space-y-4"
            noValidate
          >
            <p className="text-sm text-muted-foreground">
              Code verified for <strong>{email}</strong>. Choose a secure password.
            </p>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...passwordForm.register("newPassword")}
                  aria-invalid={!!passwordForm.formState.errors.newPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1 text-red-500 text-sm">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                At least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...passwordForm.register("confirmPassword")}
                  aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-red-500 text-sm">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={passwordForm.formState.isSubmitting || !passwordForm.formState.isValid}
              className="w-full bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15"
            >
              {passwordForm.formState.isSubmitting ? "Resetting password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle>
          {flowSource === "device"
            ? "Verifica tu dispositivo"
            : flowSource === "password"
            ? "Verify Reset Code"
            : "Verifica tu correo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="space-y-4"
          noValidate
        >
          <p className="text-sm">
            Código enviado a <strong>{email || "..."}</strong> para{" "}
            {flowSource === "device"
              ? "verificar este dispositivo"
              : flowSource === "password"
              ? "reset your password"
              : "verificar tu email"}
            .
          </p>

          <div className="space-y-1">
            <Label htmlFor="code">Ingresa el código</Label>
            <OtpInput
              key={`otp-${requestId}`}
              length={6}
              firstInputRef={firstInputRef}
              onComplete={async (code) => {
                setValue("code", code, { shouldValidate: true });
                const ok = await trigger("code");
                if (ok) handleSubmit(onSubmit, onError)();
              }}
            />
            {errors.code && (
              <p className="text-red-600 text-sm">{errors.code.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15"
          >
            {isSubmitting ? "Verificando..." : "Verificar"}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            Expira en <strong>{secondsLeft}</strong> segundos
          </p>
        </form>
      </CardContent>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <Suspense fallback={<div>Cargando...</div>}>
          <VerifyEmailForm />
        </Suspense>
      </Card>
    </div>
  );
}
