// app/verify-email/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { buildClientMeta, RequestMeta } from "@/lib/clientMeta";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import Link from "next/link";
import { useCleanCookies } from "@/hooks/useCleanCookies";

// 1️⃣ Esquema Zod
const registerSchema = z
  .object({
    email: z
      .string()
      .nonempty("El email es obligatorio")
      .email("Formato inválido"),
    password: z
      .string()
      .nonempty("La contraseña es obligatoria")
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
      .regex(/[a-z]/, "Debe tener al menos una minúscula")
      .regex(/\d/, "Debe tener al menos un número")
      .regex(/[\W_]/, "Debe tener un carácter especial"),
    confirmPassword: z.string().nonempty("Confirma tu contraseña"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  //* 🔐 Limpieza preventiva de cookies espía */
  useCleanCookies();
  //
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const router = useRouter();

  // 2️⃣ React Hook Form + Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setFocus,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  // 📺 Capturamos resolución de pantalla solo en cliente
  const [screenResolution, setScreenResolution] = useState("");
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // 3️⃣ Toggles de visibilidad
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 4️⃣ Foco en primer error
  const onError = (errs: typeof errors) => {
    const field = Object.keys(errs)[0] as keyof RegisterFormData;
    setFocus(field);
  };

  // 5️⃣ Envío al backend y redirección a verificación
  const onSubmit = async (data: RegisterFormData) => {
    // 1️⃣ Build meta (sin IP ni resolución)
    const partialMeta = buildClientMeta();
    // 2️⃣ Mergeo screenResolution
    const meta: RequestMeta = { ...partialMeta, screenResolution };

    if (!captchaToken) {
      toast("Por favor verifica que no eres un robot.");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, meta, turnstileToken: captchaToken }),
      });

      const result = await res.json();

      if (!res.ok) {
        //REVIEW: Revisar mensaje de error desde  el back en el toast
        throw new Error(result.message || "Error al iniciar sesión");
      }

      // Redirige a la página de verificación de email
      sessionStorage.setItem("pendingVerificationEmail", result.data.email);
      router.push(
        `/verify-email?token=${result.data.requestId}&expiresIn=${result.data.expiresIn}`
      );
      toast.success(`${result.message}`);
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
        <h1 className="text-3xl font-extrabold mb-2">Crea tu cuenta</h1>
        <p className="text-lg text-gray-700 dark:text-gray-500">
          Completa los campos para registrarte.
        </p>
      </section>

      {/* Card */}
      <Card className="max-w-lg mx-auto border-hidden custom-shadow">
        <CardHeader>
          <CardTitle>Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="space-y-6"
            noValidate
          >
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                {...register("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "error-email" : undefined}
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

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "error-password" : undefined
                  }
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

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "error-confirmPassword" : undefined
                  }
                  className="bg-white dark:bg-black pr-10 dark:border-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-gray-500 dark:text-gray-400"
                  aria-label={
                    showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="error-confirmPassword"
                  role="alert"
                  className="text-sm text-red-600"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Clouflare Widget */}
            <TurnstileWidget onSuccess={(token) => setCaptchaToken(token)} />

            {/* Submit */}
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
              <UserPlus className="mr-2 h-4 w-4" />
              {isSubmitting ? "Registrando..." : "Crear cuenta"}
            </Button>

            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login"
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Inicia aquí
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
