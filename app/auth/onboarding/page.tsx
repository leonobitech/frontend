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
import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

const onboardingSchema = z.object({
  name: z
    .string()
    .nonempty("Tu nombre es obligatorio")
    .max(50, "Máximo 50 caracteres"),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues: { name: "" },
  });

  useEffect(() => {
    const token = sessionStorage.getItem("passkeyPendingToken");
    if (!token) {
      toast.error("Sesión expirada. Inicia sesión de nuevo.");
      router.push("/login");
      return;
    }
    setPendingToken(token);
  }, [router]);

  const onSubmit = async (data: OnboardingData) => {
    if (!pendingToken) return;

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          pendingToken,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result?.message || "Error al completar el perfil.");
        return;
      }

      // Update pending token with the new one from onboarding response
      if (result.data?.pendingToken) {
        sessionStorage.setItem("passkeyPendingToken", result.data.pendingToken);
      }

      toast.success(`Bienvenido, ${data.name}!`, {
        icon: "👋",
        duration: 2000,
      });

      // Proceed to passkey setup
      router.push("/auth/setup-passkey");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    }
  };

  if (!pendingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Spinner className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md custom-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="w-6 h-6" />
            Completa tu perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#555] mb-4">
            Solo necesitamos saber cómo te llamas.
          </p>
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <fieldset
              disabled={form.formState.isSubmitting}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Tu nombre</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej: María González"
                  autoComplete="name"
                  autoFocus
                  {...form.register("name")}
                  aria-invalid={!!form.formState.errors.name}
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-red-500 text-sm">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <Button
                size="lg"
                type="submit"
                className="mt-4 bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15 font-semibold w-full"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                {form.formState.isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="w-4 h-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  "Continuar"
                )}
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
