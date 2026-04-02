"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerifyStatus = "loading" | "success" | "error";

export default function VerifyMagicLinkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const token = searchParams.get("token");
    const rid = searchParams.get("rid");

    if (!token || !rid) {
      setStatus("error");
      setErrorMessage("Link inválido. Solicita uno nuevo desde /login.");
      return;
    }

    verifyMagicLink(token, rid);
  }, [searchParams]);

  const verifyMagicLink = async (token: string, rid: string) => {
    try {
      const res = await fetch("/api/auth/verify-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, requestId: rid }),
      });
      const result = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(
          result?.message || "Error al verificar. Solicita un nuevo link."
        );
        return;
      }

      setStatus("success");

      // Route based on status
      const { pendingToken, email } = result.data;

      if (result.status === "onboardingRequired") {
        sessionStorage.setItem("passkeyPendingToken", pendingToken);
        sessionStorage.setItem("passkeyPendingEmail", email);

        toast("Completa tu perfil", {
          description: "Solo necesitamos tu nombre.",
          icon: "👋",
          duration: 3000,
        });

        setTimeout(() => router.push("/auth/onboarding"), 1000);
        return;
      }

      if (result.status === "passkeySetupRequired") {
        sessionStorage.setItem("passkeyPendingToken", pendingToken);
        sessionStorage.setItem("passkeyPendingEmail", email);

        toast("Configura tu passkey", {
          description: "Para proteger tu cuenta con acceso seguro.",
          icon: "🔐",
          duration: 3000,
        });

        setTimeout(() => router.push("/auth/setup-passkey"), 1000);
        return;
      }

      if (result.status === "passkeyVerifyRequired") {
        sessionStorage.setItem("passkeyPendingToken", pendingToken);
        sessionStorage.setItem("passkeyPendingEmail", email);

        toast("Verifica tu identidad", {
          description: "Usa tu passkey para completar el login.",
          icon: "🔐",
          duration: 3000,
        });

        setTimeout(() => router.push("/auth/verify-passkey"), 1000);
        return;
      }
    } catch {
      setStatus("error");
      setErrorMessage("Error de conexión. Intenta de nuevo.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md custom-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "loading" && (
              <>
                <Spinner className="w-5 h-5 animate-spin" />
                Verificando...
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Verificado
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                Error
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <p className="text-[#555]">
              Estamos verificando tu link de acceso...
            </p>
          )}
          {status === "success" && (
            <p className="text-[#555]">
              Redirigiendo...
            </p>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <p className="text-[#555]">{errorMessage}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Volver al login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
