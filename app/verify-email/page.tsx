"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { buildClientMeta } from "@/lib/clientMeta";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { OtpInput } from "@/components/OtpInput";

const verifySchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});
type VerifyForm = z.infer<typeof verifySchema>;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [requestId, setRequestId] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [screenResolution, setScreenResolution] = useState("");

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

  // 🧠 Sync requestId y expiresIn desde la URL
  useEffect(() => {
    const token = searchParams.get("token") || "";
    const expiresIn = Number(searchParams.get("expiresIn") || "0");

    setRequestId(token);
    if (expiresIn > 0) {
      setExpiresAt(new Date(Date.now() + expiresIn * 1000));
    }
  }, [searchParams]);

  // 💾 Cargar email desde sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("pendingVerificationEmail");
    if (stored) setEmail(stored);
  }, []);

  // 🖥️ Capturar resolución
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // ⏱️ Contador visible
  useEffect(() => {
    if (!expiresAt) return;

    const updateCountdown = () => {
      const diff = Math.max(
        0,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const onError = (errs: typeof errors) => {
    const field = Object.keys(errs)[0];
    if (field === "code") {
      setFocus("code");
    }
  };

  const onSubmit = async (data: VerifyForm) => {
    if (!email || !requestId) {
      toast.error("Faltan datos para verificar el código.");
      return;
    }

    const parsedEmail = z.string().email().safeParse(email);
    if (!parsedEmail.success) {
      toast.error("El email almacenado es inválido.");
      return;
    }

    const meta = { ...buildClientMeta(), screenResolution };

    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parsedEmail.data,
          code: data.code,
          requestId,
          meta,
        }),
      });

      const result = await res.json();

      if (result?.resend) {
        toast(result.message || "Te enviamos un nuevo código.");

        if (result.requestId && result.expiresIn) {
          const newExp = new Date(Date.now() + result.expiresIn * 1000);
          setRequestId(result.requestId);
          setExpiresAt(newExp);
          reset({ code: "" });

          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set("token", result.requestId);
          newUrl.searchParams.set("expiresIn", result.expiresIn.toString());
          window.history.replaceState({}, "", newUrl.toString());
        } else {
          setExpiresAt(new Date(Date.now() + 300000));
        }

        return;
      }

      if (!res.ok) throw new Error(result.message);

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
        <OtpInput
          length={6}
          onComplete={async (code) => {
            setValue("code", code);
            const isValid = await trigger("code");
            if (isValid && email && requestId) {
              handleSubmit(onSubmit)();
            }
          }}
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
          Tu código expira en{" "}
          <AnimatePresence mode="wait">
            <motion.span
              key={secondsLeft}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.25 }}
              className="font-semibold text-white dark:text-blue-400 inline-block w-8 text-center"
            >
              {secondsLeft}
            </motion.span>{" "}
            segundos
          </AnimatePresence>
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
