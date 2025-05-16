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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setFocus,
    trigger,
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  // 📺 Capturamos resolución de pantalla solo en cliente
  const [screenResolution, setScreenResolution] = useState("");
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const email = getValues("email");
      const password = getValues("password");

      if (email && password && !isValid) {
        trigger(["email", "password"]);
      }
    }, 100); // ⏱️ Esperamos un frame para detectar el autocomplete del browser

    return () => clearTimeout(timeout);
  }, [getValues, isValid, trigger]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      handleSubmit(onSubmit, onError)();
    }
  };

  const onError = (formErrors: typeof errors) => {
    const firstError = Object.keys(formErrors)[0] as keyof LoginFormData;
    setFocus(firstError);
  };

  const onSubmit = async (data: LoginFormData) => {
    const partialMeta = buildClientMeta();
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

      if (!res.ok) {
        toast.error(result?.message || "Error al iniciar sesión.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
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
            onSubmit={handleSubmit(onSubmit, onError)}
            onKeyDown={handleKeyDown}
            className="space-y-4"
          >
            <div>
              <Label>Email</Label>
              <Input type="email" autoComplete="email" {...register("email")} />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label>Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
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

            {/* Clouflare Widget */}
            <TurnstileWidget
              onSuccess={(token) => setCaptchaToken(token)}
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY!}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isSubmitting}
            >
              Ingresar
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
