"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { buildClientMeta } from "@/lib/clientMeta";
import { useQueryClient } from "@tanstack/react-query";

// 🛡️ Validación del código
const verifySchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});
type VerifyForm = z.infer<typeof verifySchema>;

function VerifyEmailForm() {
  const [screenResolution, setScreenResolution] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const initialToken = params.get("token");
  const initialExpiresIn = Number(params.get("expiresIn") ?? "0");

  const [email, setEmail] = useState("");
  const [requestId, setRequestId] = useState(initialToken || "");
  const [seconds, setSeconds] = useState(initialExpiresIn);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setFocus,
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    mode: "onBlur",
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingVerificationEmail");
    if (stored) setEmail(stored);
  }, []);

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  const onError = (errs: typeof errors) => {
    const field = Object.keys(errs)[0];
    if (field === "code") {
      setFocus("code");
    }
  };

  const onSubmit = async (data: VerifyForm) => {
    if (!email || !requestId) {
      toast.error("No hay datos de verificación disponibles.");
      return;
    }

    const parsedEmail = z.string().email().safeParse(email);
    if (!parsedEmail.success) {
      toast.error("El email almacenado es inválido");
      return;
    }

    const meta = {
      ...buildClientMeta(),
      screenResolution,
    };

    const payload = {
      email: parsedEmail.data,
      code: data.code,
      requestId,
      meta,
    };

    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      // 🔁 Actualizamos el token y el tiempo de expiración en el estado
      if (result?.resend) {
        toast(result.message || "Te enviamos uno nuevo al correo.");
        if (result.requestId && result.expiresIn) {
          setRequestId(result.requestId);
          setSeconds(result.expiresIn);
        } else {
          setSeconds(300); // fallback en caso de que no lo devuelva (por si acaso)
        }
        return;
      }

      if (!res.ok) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      sessionStorage.removeItem("pendingVerificationEmail");
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="space-y-4"
      noValidate
    >
      <p className="text-sm">
        Hemos enviado un código de 6 dígitos a <strong>{email || "..."}</strong>
        .
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
        <span className="text-sm text-gray-500">
          Tu código expira en {seconds} segundos
        </span>
      </div>
    </form>
  );
}

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
