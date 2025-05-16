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

// 🎯 Esquema de validación
const loginSchema = z.object({
  email: z
    .string()
    .nonempty("El email es obligatorio")
    .email("Formato de email inválido"),
  password: z.string().nonempty("La contraseña es obligatoria"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  useCleanCookies();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [screenResolution, setScreenResolution] = useState("");

  // 🛠️ Form setup: validación en cada cambio para experiencia más fluida
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    trigger,
    getValues,
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  // 📺 Detectar autocompletado y revalidar si es necesario
  useEffect(() => {
    const timeout = setTimeout(() => {
      const { email, password } = getValues();
      if ((email || password) && !isValid) {
        trigger();
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [getValues, isValid, trigger]);

  // 🔄 Revalidar campos clave al recibir token del captcha
  useEffect(() => {
    if (captchaToken) {
      trigger(["email", "password"]);
    }
  }, [captchaToken, trigger]);

  // 📐 Capturamos resolución de pantalla
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // ⌨️ Soporte tecla Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && isValid && captchaToken && !isSubmitting) {
      handleSubmit(onSubmit, onError)();
    }
  };

  const onError = (formErrors: typeof errors) => {
    const firstField = Object.keys(formErrors)[0] as keyof LoginFormData;
    setFocus(firstField);
  };

  const onSubmit = async (data: LoginFormData) => {
    if (!captchaToken) {
      toast("Por favor verifica que no eres un robot.");
      return;
    }

    const meta: RequestMeta = {
      ...buildClientMeta(),
      screenResolution,
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
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    }
  };

  return (
    <div className="flex justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5" />
            Iniciar sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit, onError)}
            onKeyDown={handleKeyDown}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
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
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            <TurnstileWidget
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY!}
              onSuccess={setCaptchaToken}
            />

            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-950
                hover:from-blue-600 hover:to-indigo-600
                dark:from-pink-600 dark:to-purple-600
                dark:hover:from-pink-600 dark:hover:to-purple-600/80
                hover:shadow-lg hover:scale-105
                transition-all duration-300 ease-out
                text-white font-semibold w-full"
              disabled={!isValid || isSubmitting || !captchaToken}
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </Button>

            <p className="text-sm text-center mt-4">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-blue-500 underline">
                Crear una
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
