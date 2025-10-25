"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Fingerprint, KeyRound } from "lucide-react";
import { buildClientMetaWithResolution, RequestMeta } from "@/lib/clientMeta";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import Link from "next/link";
import { useCleanCookies } from "@/hooks/useCleanCookies";
import { Spinner } from "@/components/ui/spinner";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PasskeyLoginChallengeResponse } from "@/types/passkey";

// 🎯 Schema para login con password
const passwordLoginSchema = z.object({
  email: z
    .string()
    .nonempty("El email es obligatorio")
    .email("Formato de email inválido"),
  password: z.string().nonempty("La contraseña es obligatoria"),
});

// 🎯 Schema para login con passkey (solo email)
const passkeyLoginSchema = z.object({
  email: z
    .string()
    .nonempty("El email es obligatorio")
    .email("Formato de email inválido"),
});

type PasswordLoginData = z.infer<typeof passwordLoginSchema>;
type PasskeyLoginData = z.infer<typeof passkeyLoginSchema>;

export default function LoginPage() {
  useCleanCookies();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"password" | "passkey">("password");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [screenResolution, setScreenResolution] = useState("");
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  // Form para login con password
  const passwordForm = useForm<PasswordLoginData>({
    resolver: zodResolver(passwordLoginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  // Form para login con passkey
  const passkeyForm = useForm<PasskeyLoginData>({
    resolver: zodResolver(passkeyLoginSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  // 📐 Capturamos resolución de pantalla
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // 🔄 Revalidar al cambiar de tab
  useEffect(() => {
    if (activeTab === "password") {
      passwordForm.trigger();
    } else {
      passkeyForm.trigger();
    }
  }, [activeTab, passwordForm, passkeyForm]);

  // ========== PASSWORD LOGIN ==========
  const onPasswordSubmit = async (data: PasswordLoginData) => {
    // 🔧 TEMPORAL: Bypass Turnstile si no se carga (problema con Safari/bloqueadores)
    const finalCaptchaToken = captchaToken || "bypass-turnstile-loading-issue";

    if (!captchaToken) {
      console.warn("⚠️ Turnstile no disponible, usando bypass temporal");
    }

    const meta: RequestMeta = {
      ...buildClientMetaWithResolution(screenResolution, {
        label: "leonobitech",
      }),
    };

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, meta, turnstileToken: finalCaptchaToken }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result?.message || "Error al iniciar sesión.");
        return;
      }

      // 🧠 Nuevo dispositivo → requiere verificación
      if (result.status === "devicePendingVerification") {
        sessionStorage.setItem("pendingVerificationEmail", result.data.email);

        toast("Verificación requerida en nuevo dispositivo", {
          description:
            "Te enviamos un código a tu correo para confirmar tu identidad.",
          icon: "📲",
          duration: 5000,
        });

        router.push(
          `/verify-email?token=${result.data.requestId}&expiresIn=${result.data.expiresIn}&source=device`
        );
        return;
      }

      toast.success("Welcome back! You've successfully logged in.", {
        icon: "🚀",
        duration: 1500,
      });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    }
  };

  // ========== PASSKEY LOGIN ==========
  const onPasskeySubmit = async (data: PasskeyLoginData) => {
    if (!captchaToken) {
      toast("Por favor verifica que no eres un robot.");
      return;
    }

    setIsPasskeyLoading(true);
    try {
      const meta: RequestMeta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/passkey/login/challenge:${requestId}`;

      // Step 1: Get login challenge
      const challengeResponse = await fetch("/api/passkey/login/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({ email: data.email, meta }),
      });

      if (!challengeResponse.ok) {
        const error = await challengeResponse.json();
        throw new Error(error.message || "Failed to generate challenge");
      }

      const challengeData: PasskeyLoginChallengeResponse =
        await challengeResponse.json();

      // Step 2: Use browser WebAuthn API to authenticate
      const credential = await startAuthentication({
        optionsJSON: challengeData.options,
      });

      // Step 3: Verify credential with backend
      const verifyRequestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const verifyIdemKey = `/api/passkey/login/verify:${verifyRequestId}`;

      const verifyResponse = await fetch("/api/passkey/login/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": verifyRequestId,
          "Idempotency-Key": verifyIdemKey,
        },
        body: JSON.stringify({ credential, meta }),
        credentials: "include",
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.message || "Failed to verify passkey");
      }

      toast.success("Welcome back! You've successfully logged in with passkey.", {
        icon: "🔐",
        duration: 1500,
      });

      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error with passkey login";
      toast.error(msg);
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="flex align-middle justify-center px-1 pt-14 pb-8">
      <Card className="w-full max-w-md custom-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="relative w-14 h-14">
              <Image
                src="/icon.png"
                alt="icon"
                fill
                sizes="56px"
                className="object-contain"
                priority
              />
            </div>
            Iniciar sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "password" | "passkey")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="password" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Password
              </TabsTrigger>
              <TabsTrigger value="passkey" className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                Passkey
              </TabsTrigger>
            </TabsList>

            {/* ========== PASSWORD TAB ========== */}
            <TabsContent value="password" className="space-y-4">
              <form
                noValidate
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <fieldset disabled={passwordForm.formState.isSubmitting} className="space-y-4">
                  {/* Email */}
                  <div>
                    <Label htmlFor="password-email">Email</Label>
                    <Input
                      id="password-email"
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      autoComplete="email"
                      {...passwordForm.register("email")}
                      aria-invalid={!!passwordForm.formState.errors.email}
                    />
                    {passwordForm.formState.errors.email && (
                      <p className="mt-1 text-red-500 text-sm">
                        {passwordForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        {...passwordForm.register("password")}
                        placeholder="••••••••"
                        aria-invalid={!!passwordForm.formState.errors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">
                        {passwordForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <TurnstileWidget
                    sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY!}
                    onSuccess={setCaptchaToken}
                  />

                  <Button
                    size="lg"
                    type="submit"
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-950
                    hover:from-blue-600 hover:to-indigo-600
                    dark:from-pink-600 dark:to-purple-600
                    dark:hover:from-pink-600 dark:hover:to-purple-600/80
                    hover:shadow-lg hover:scale-105
                    transition-all duration-300 ease-out
                    text-white font-semibold w-full"
                    disabled={
                      !passwordForm.formState.isValid ||
                      passwordForm.formState.isSubmitting ||
                      !captchaToken
                    }
                  >
                    {passwordForm.formState.isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner className="w-4 h-4 animate-spin" />
                        Ingresando…
                      </span>
                    ) : (
                      "Ingresar"
                    )}
                  </Button>
                </fieldset>
              </form>
            </TabsContent>

            {/* ========== PASSKEY TAB ========== */}
            <TabsContent value="passkey" className="space-y-4">
              <form
                noValidate
                onSubmit={passkeyForm.handleSubmit(onPasskeySubmit)}
                className="space-y-4"
              >
                <fieldset disabled={isPasskeyLoading} className="space-y-4">
                  {/* Email */}
                  <div>
                    <Label htmlFor="passkey-email">Email</Label>
                    <Input
                      id="passkey-email"
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      autoComplete="email webauthn"
                      {...passkeyForm.register("email")}
                      aria-invalid={!!passkeyForm.formState.errors.email}
                    />
                    {passkeyForm.formState.errors.email && (
                      <p className="mt-1 text-red-500 text-sm">
                        {passkeyForm.formState.errors.email.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Only your email is required for passkey authentication
                    </p>
                  </div>

                  <TurnstileWidget
                    sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY!}
                    onSuccess={setCaptchaToken}
                  />

                  <Button
                    size="lg"
                    type="submit"
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600
                    hover:from-purple-700 hover:to-pink-700
                    dark:from-purple-600 dark:to-pink-600
                    dark:hover:from-purple-700 dark:hover:to-pink-700
                    hover:shadow-lg hover:scale-105
                    transition-all duration-300 ease-out
                    text-white font-semibold w-full"
                    disabled={
                      !passkeyForm.formState.isValid ||
                      isPasskeyLoading ||
                      !captchaToken
                    }
                  >
                    {isPasskeyLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner className="w-4 h-4 animate-spin" />
                        Authenticating…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Fingerprint className="w-5 h-5" />
                        Login with Passkey
                      </span>
                    )}
                  </Button>
                </fieldset>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
