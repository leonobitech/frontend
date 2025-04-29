"use client";

import React, { Suspense, useState, useEffect } from "react";
// 👇 Ojo que useSearchParams queda igual
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { buildClientMeta, RequestMeta } from "@/lib/clientMeta";

// 1️⃣ Schema Zod para el OTP de 6 dígitos
const verifySchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});
type VerifyForm = z.infer<typeof verifySchema>;

// ✅ Extraemos tu formulario en un componente aparte
function VerifyEmailForm() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setFocus,
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    mode: "onBlur",
  });

  const [screenResolution, setScreenResolution] = useState<string>("");
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  const onError = (errs: typeof errors) => {
    const field = Object.keys(errs)[0] as keyof VerifyForm;
    setFocus(field);
  };

  const onSubmit = async (data: VerifyForm) => {
    const partialMeta = buildClientMeta();
    const meta: RequestMeta = { ...partialMeta, screenResolution };

    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: data.code, meta }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      toast({ title: result.message });
      router.push("/dashboard");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast({ variant: "destructive", title: "Error", description: msg });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="space-y-4"
      noValidate
    >
      <p className="text-sm">
        Hemos enviado un código de 6 dígitos a <strong>{email}</strong>.
      </p>
      <div className="space-y-1">
        <Label htmlFor="code">Código OTP</Label>
        <Input
          id="code"
          placeholder="000000"
          {...register("code")}
          aria-invalid={!!errors.code}
          aria-describedby={errors.code ? "error-code" : undefined}
          className="custom-shadow"
        />
        {errors.code && (
          <p id="error-code" role="alert" className="text-red-600 text-sm">
            {errors.code.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        size="sm"
        className="w-full"
      >
        {isSubmitting ? "Verificando..." : "Verificar"}
      </Button>
      <div className="text-center mt-2">
        {screenResolution ? (
          <span className="text-sm text-gray-500">
            Resolución: {screenResolution}
          </span>
        ) : (
          <span className="text-sm text-gray-500">Cargando resolución…</span>
        )}
      </div>
    </form>
  );
}

// ⬇️ Acá usas Suspense para envolverlo
export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verifica tu correo</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Cargando formulario...</div>}>
            <VerifyEmailForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
