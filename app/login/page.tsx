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
import { Mail, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { useCleanCookies } from "@/hooks/useCleanCookies";
import { Spinner } from "@/components/ui/spinner";
import { startAuthentication } from "@simplewebauthn/browser";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

const loginSchema = z.object({
  email: z
    .string()
    .nonempty("El email es obligatorio")
    .email("Formato de email inválido"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  useCleanCookies();
  const router = useRouter();

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [screenResolution, setScreenResolution] = useState("");

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  // Magic Link flow
  const onSubmit = async (data: LoginData) => {
    if (!captchaToken) return;

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          turnstileToken: captchaToken,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result?.message || "Error al enviar magic link.");
        return;
      }

      setSentEmail(data.email);
      setMagicLinkSent(true);
      toast.success("Link enviado a tu correo", {
        icon: "📧",
        duration: 3000,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    }
  };

  // Passkey-only login (shortcut, no email needed)
  const handlePasskeyLogin = async () => {
    try {
      const meta = buildClientMetaWithResolution(screenResolution, {
        label: "leonobitech",
      });

      // Get challenge from backend
      const challengeRes = await fetch("/api/passkey/login/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta }),
      });

      if (!challengeRes.ok) {
        toast.error("No se pudo iniciar la verificación con passkey.");
        return;
      }

      const challengeData = await challengeRes.json();
      const options = challengeData.data?.options || challengeData.options;

      // Trigger browser passkey prompt
      const credential = await startAuthentication({ optionsJSON: options });

      // Verify with backend
      const verifyRes = await fetch("/api/passkey/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, meta }),
      });

      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json();
        toast.error(verifyData?.message || "Error al verificar passkey.");
        return;
      }

      toast.success("Bienvenido de vuelta!", { icon: "🚀", duration: 1500 });
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        toast.error("Verificación cancelada.");
        return;
      }
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    }
  };

  // "Check your email" screen
  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md custom-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Revisa tu correo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[#555]">
              Enviamos un link de acceso a{" "}
              <strong className="text-[#3A3A3A] dark:text-[#D1D5DB]">
                {sentEmail}
              </strong>
            </p>
            <p className="text-sm text-[#777]">
              Haz clic en el link del correo para iniciar sesión. El link expira
              en 5 minutos.
            </p>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => {
                setMagicLinkSent(false);
                setCaptchaToken(null);
              }}
            >
              Usar otro email
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
            Iniciar sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <fieldset
              disabled={form.formState.isSubmitting}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email webauthn"
                  {...form.register("email")}
                  aria-invalid={!!form.formState.errors.email}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-red-500 text-sm">
                    {form.formState.errors.email.message}
                  </p>
                )}
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
                    Enviando...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Enviar link de acceso
                  </span>
                )}
              </Button>
            </fieldset>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#1a1a1a] px-2 text-gray-500">
                o
              </span>
            </div>
          </div>

          {/* Passkey login */}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handlePasskeyLogin}
          >
            <KeyRound className="w-4 h-4 mr-2" />
            Entrar con Passkey
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
