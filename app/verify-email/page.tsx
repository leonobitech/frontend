"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { buildClientMetaWithResolution, RequestMeta } from "@/lib/clientMeta";
import { useQueryClient } from "@tanstack/react-query";
import { OtpInput } from "@/components/OtpInput";

const verifySchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});
type VerifyForm = z.infer<typeof verifySchema>;

function VerifyEmailForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 🔐 Protección contra acceso sin contexto
  useEffect(() => {
    const email = sessionStorage.getItem("pendingVerificationEmail");
    const token = new URLSearchParams(window.location.search).get("token");

    if (!email || !token) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [email, setEmail] = useState("");
  const [screenResolution, setScreenResolution] = useState("");
  const [requestId, setRequestId] = useState("");
  const [flowSource, setFlowSource] = useState<"email" | "device">("email");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setFocus,
    setValue,
    reset,
    trigger,
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    mode: "onBlur",
  });

  // Obtener token y expiración de la URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || "";
    const expiresIn = Number(params.get("expiresIn") || "0");
    const source = params.get("source") || "email";

    setRequestId(token);
    setFlowSource(source === "device" ? "device" : "email");

    if (expiresIn > 0) {
      setExpiresAt(new Date(Date.now() + expiresIn * 1000));
    }
    firstInputRef.current?.focus();
  }, []);

  // Cargar email pendiente
  useEffect(() => {
    const stored = sessionStorage.getItem("pendingVerificationEmail");
    if (stored) setEmail(stored);
  }, []);

  // Capturar resolución de pantalla
  useEffect(() => {
    if (typeof window === "undefined") return;
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // Countdown
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      setSecondsLeft(
        Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const onError = (errs: typeof errors) => {
    const field = Object.keys(errs)[0] as keyof VerifyForm;
    setFocus(field);
  };

  const onSubmit = async (data: VerifyForm) => {
    if (!email || !requestId) {
      toast.error("Faltan datos para verificar.");
      return;
    }
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Email inválido.");
      return;
    }

    const meta: RequestMeta = {
      ...buildClientMetaWithResolution(screenResolution, {
        label: "verify-email;",
      }),
    };
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsed.data,
          code: data.code,
          requestId,
          meta,
        }),
      });
      const result = await res.json();

      // Flujo de reenvío
      if (result?.resend) {
        toast.success(result.message || "Código re-enviado.");
        if (result.requestId && result.expiresIn) {
          setRequestId(result.requestId);
          setExpiresAt(new Date(Date.now() + result.expiresIn * 1000));
          reset({ code: "" });
          firstInputRef.current?.focus();
          const url = new URL(window.location.href);
          url.searchParams.set("token", result.requestId);
          url.searchParams.set("expiresIn", result.expiresIn.toString());
          window.history.replaceState({}, "", url.toString());
        }
        return;
      }

      if (!res.ok) throw new Error(result.message);
      if (result.alreadyVerified) {
        toast("Ya habías verificado anteriormente", {
          icon: "ℹ️",
          duration: 3000,
        });
      }
      sessionStorage.removeItem("pendingVerificationEmail");
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success(result.message);
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>
          {flowSource === "device"
            ? "Verifica tu dispositivo"
            : "Verifica tu correo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="space-y-4"
          noValidate
        >
          <p className="text-sm">
            Código enviado a <strong>{email || "..."}</strong> para verificar{" "}
            {flowSource === "device" ? "este dispositivo" : "tu email"}.
          </p>

          <div className="space-y-1">
            <Label htmlFor="code">Ingresa el código</Label>
            <OtpInput
              key={`otp-${requestId}`} // 👈 clave mágica
              length={6}
              firstInputRef={firstInputRef}
              onComplete={async (code) => {
                setValue("code", code, { shouldValidate: true }); // ← esto forza validación
                const ok = await trigger("code");
                if (ok) handleSubmit(onSubmit, onError)();
              }}
            />
            {errors.code && (
              <p className="text-red-600 text-sm">{errors.code.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full"
          >
            {isSubmitting ? "Verificando..." : "Verificar"}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            Expira en <strong>{secondsLeft}</strong> segundos
          </p>
        </form>
      </CardContent>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <Suspense fallback={<div>Cargando...</div>}>
          <VerifyEmailForm />
        </Suspense>
      </Card>
    </div>
  );
}
