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
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { buildClientMeta, RequestMeta } from "@/lib/clientMeta";

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
  const router = useRouter();
  const { toast } = useToast();

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
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, meta }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      toast({ title: result.message });
      // Redirige a la página de verificación de email
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error: unknown) {
      let message = "Ha ocurrido un error";
      if (error instanceof Error) message = error.message;
      else if (typeof error === "string") message = error;

      toast({ variant: "destructive", title: "Error", description: message });
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
                className="bg-white dark:bg-black custom-shadow dark:border-hidden"
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
                  className="bg-white dark:bg-black pr-10 custom-shadow dark:border-hidden"
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
                  className="bg-white dark:bg-black pr-10 custom-shadow dark:border-hidden"
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
