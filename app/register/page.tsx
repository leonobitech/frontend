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
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { buildClientMeta, RequestMeta } from "@/lib/clientMeta";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import Link from "next/link";
import { useCleanCookies } from "@/hooks/useCleanCookies";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

// 🎯 Esquema Zod
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
      .regex(/[^A-Za-z0-9]/, "Debe tener un carácter especial"),
    confirmPassword: z.string().nonempty("Confirma tu contraseña"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  useCleanCookies();
  const router = useRouter();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [screenResolution, setScreenResolution] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
    trigger,
    setFocus,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // Capturar resolución de pantalla
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // Revalidar confirmPassword al cambiar password
  const passwordValue = watch("password");
  useEffect(() => {
    if (passwordValue) {
      trigger("confirmPassword");
    }
  }, [passwordValue, trigger]);

  const onError = (errs: typeof errors) => {
    const firstField = Object.keys(errs)[0] as keyof RegisterFormData;
    setFocus(firstField);
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!captchaToken) {
      toast("Por favor verifica que no eres un robot.");
      return;
    }
    const meta: RequestMeta = {
      ...buildClientMeta(),
      screenResolution,
    };
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, meta, turnstileToken: captchaToken }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Error al registrar.");
      }
      sessionStorage.setItem("pendingVerificationEmail", result.data.email);
      toast.success(result.message, { icon: "✔️", duration: 3000 });
      router.push(
        `/verify-email?token=${result.data.requestId}&expiresIn=${result.data.expiresIn}`
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && isValid && captchaToken && !isSubmitting) {
      handleSubmit(onSubmit, onError)();
    }
  };

  return (
    <div className="flex justify-center px-1 py-8">
      <Card className="w-full max-w-md custom-shadow">
        <CardHeader>
          <CardTitle>Crea tu cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit, onError)}
            onKeyDown={handleKeyDown}
            className="space-y-6"
          >
            <fieldset disabled={isSubmitting} className="space-y-6">
              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "error-email" : undefined}
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
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("password")}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "error-password" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
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
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword
                        ? "error-confirmPassword"
                        : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
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

              {/* Turnstile Widget */}
              <TurnstileWidget
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY!}
                onSuccess={setCaptchaToken}
              />

              {/* Submit */}
              <Button
                size="sm"
                type="submit"
                className={`
                  bg-gradient-to-r from-blue-600 to-indigo-950
                hover:from-blue-600 hover:to-indigo-600
                dark:from-pink-600 dark:to-purple-600
                dark:hover:from-pink-600 dark:hover:to-purple-600/80
                hover:shadow-lg hover:scale-105
                transition-all duration-300 ease-out
                text-white font-semibold w-full
                `}
                disabled={!isValid || isSubmitting || !captchaToken}
                aria-disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                    Registrando...
                  </span>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear cuenta
                  </>
                )}
              </Button>
            </fieldset>

            {/* Live region */}
            <div role="status" aria-live="polite" className="sr-only">
              {isSubmitting && "Registering... Please wait."}
            </div>

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
