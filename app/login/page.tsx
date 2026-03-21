"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { buildClientMetaWithResolution, RequestMeta } from "@/lib/clientMeta";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import Link from "next/link";
import { useCleanCookies } from "@/hooks/useCleanCookies";
import { Spinner } from "@/components/ui/spinner";

const loginSchema = z.object({
  email: z
    .string()
    .nonempty("El email es obligatorio")
    .email("Formato de email inválido"),
  password: z.string().nonempty("La contraseña es obligatoria"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  useCleanCookies();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [screenResolution, setScreenResolution] = useState("");

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  const onSubmit = async (data: LoginData) => {
    if (!captchaToken) return;

    const meta: RequestMeta = {
      ...buildClientMetaWithResolution(screenResolution, {
        label: "leonobitech",
      }),
    };

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, meta, turnstileToken: captchaToken }),
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

      // 🔐 Passkey setup required (first time after registration)
      if (result.status === "passkeySetupRequired") {
        sessionStorage.setItem("passkeyPendingToken", result.data.pendingToken);
        sessionStorage.setItem("passkeyPendingEmail", result.data.email);

        toast("Configuración de passkey requerida", {
          description: "Por favor configura tu teléfono como método de autenticación seguro.",
          icon: "🔐",
          duration: 5000,
        });

        router.push("/auth/setup-passkey");
        return;
      }

      // 🔐 Passkey verification required (subsequent logins)
      if (result.status === "passkeyVerifyRequired") {
        sessionStorage.setItem("passkeyPendingToken", result.data.pendingToken);
        sessionStorage.setItem("passkeyPendingEmail", result.data.email);

        toast("Verificación de passkey requerida", {
          description: "Por favor verifica con tu teléfono para completar el login.",
          icon: "🔐",
          duration: 5000,
        });

        router.push("/auth/verify-passkey");
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
            Iniciar sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <fieldset disabled={form.formState.isSubmitting} className="space-y-4">
              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email"
                  {...form.register("email")}
                  aria-invalid={!!form.formState.errors.email}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-red-500 text-sm">
                    {form.formState.errors.email.message}
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
                    {...form.register("password")}
                    placeholder="••••••••"
                    aria-invalid={!!form.formState.errors.password}
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
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#3A3A3A] dark:text-[#D1D5DB] hover:opacity-80"
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
                className="mt-4 bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15 font-semibold w-full"
                disabled={
                  !form.formState.isValid ||
                  form.formState.isSubmitting ||
                  !captchaToken
                }
              >
                {form.formState.isSubmitting ? (
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

          <div className="mt-6 text-center text-sm">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-[#3A3A3A] dark:text-[#D1D5DB] hover:opacity-80"
            >
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
