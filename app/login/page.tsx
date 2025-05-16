"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { buildClientMeta, RequestMeta } from "@/lib/clientMeta";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import Link from "next/link";
import { useCleanCookies } from "@/hooks/useCleanCookies";

// 1️⃣ Definimos el esquema Zod para login
const loginSchema = z.object({
  email: z
    .string()
    .nonempty("El email es obligatorio")
    .email("Formato de email inválido"),
  password: z.string().nonempty("La contraseña es obligatoria"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  //* 🔐 Limpieza preventiva de cookies espía */
  useCleanCookies();
  //
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // 2️⃣ Inicializamos React Hook Form con Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  // 📺 Capturamos resolución de pantalla solo en cliente
  const [screenResolution, setScreenResolution] = useState("");
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // 3️⃣ Toggle para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  // 4️⃣ Enfocar el primer error tras fallo
  const onError = (formErrors: typeof errors) => {
    const firstError = Object.keys(formErrors)[0] as keyof LoginFormData;
    setFocus(firstError);
  };

  // 5️⃣ Envío al backend
  const onSubmit = async (data: LoginFormData) => {
    // 1️⃣ Build meta (sin IP ni resolución)
    const partialMeta = buildClientMeta();
    // 2️⃣ Mergeo screenResolution
    const meta: RequestMeta = { ...partialMeta, screenResolution };

    const tokenCheck = z.string().nonempty().safeParse(captchaToken);
    if (!tokenCheck.success) {
      toast("Por favor verifica que no eres un robot.");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, meta, turnstileToken: captchaToken }),
      });

      const result = await res.json();
      console.log(res);

      // ✅ Chequeá res.ok antes de validar status lógico
      if (!res.ok) {
        throw new Error(result.message || "Error HTTP inesperado");
      }

      if (result.status === "SUCCESS") {
        // 🟢 Login normal
        await queryClient.invalidateQueries({ queryKey: ["session"] });
        router.push("/dashboard");
        toast.success(`${result.message}`);
      } else if (result.status === "DEVICE_PENDING_VERIFICATION") {
        // 🟡 Device desconocido → Redirigir al paso de verificación
        // Redirige a la página de verificación de email
        sessionStorage.setItem("pendingVerificationEmail", result.data.email);
        router.push(
          `/verify-email?token=${result.data.requestId}&expiresIn=${result.data.expiresIn}`
        );
        toast.success(`${result.message}`);
      } else {
        // 🚨 Si no es un status esperado
        throw new Error(result.message || "Error al iniciar sesión");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`${message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <section className="text-center mb-10">
        <h1 className="text-3xl font-extrabold mb-2">Inicia sesión</h1>
        <p className="text-lg text-gray-700 dark:text-gray-500">
          Ingresa tus credenciales para continuar.
        </p>
      </section>

      {/* Card */}
      <Card className="max-w-lg mx-auto border-hidden custom-shadow">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="space-y-6"
            noValidate
          >
            {/* Email Field */}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "error-email" : undefined}
                {...register("email")}
                className="bg-white dark:bg-black dark:border-hidden"
              />
              {errors.email && (
                <p
                  id="error-email"
                  role="alert"
                  className="text-sm text-red-600"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1 relative">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "error-password" : undefined
                  }
                  {...register("password")}
                  className="bg-white dark:bg-black pr-10 dark:border-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-gray-500 dark:text-gray-400"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="error-password"
                  role="alert"
                  className="text-sm text-red-600"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Clouflare Widget */}
            <TurnstileWidget
              onSuccess={(token) => setCaptchaToken(token)}
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY!}
            />

            {/* Submit Button */}
            <Button
              size="sm"
              type="submit"
              disabled={isSubmitting || !isValid}
              className={`
                bg-gradient-to-r from-blue-600 to-indigo-950
                hover:from-blue-600 hover:to-indigo-600
                dark:from-pink-600 dark:to-purple-600
                dark:hover:from-pink-600 dark:hover:to-purple-600/80
                hover:shadow-lg hover:scale-105
                transition-all duration-300 ease-out
                text-white font-semibold w-full
                ${
                  isSubmitting || !isValid
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isSubmitting ? "Cargando..." : "Entrar"}
            </Button>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
              ¿Aún no tienes cuenta?{" "}
              <Link
                href="/register"
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Créala aquí
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
