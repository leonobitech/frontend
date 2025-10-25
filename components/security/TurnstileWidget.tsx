// components/security/TurnstileWidget.tsx
"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type Props = {
  onSuccess: (token: string) => void;
  sitekey: string;
  className?: string;
};

export function TurnstileWidget({ onSuccess, sitekey, className = "" }: Props) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("🔍 TurnstileWidget montado, widgetRef:", !!widgetRef.current);
    console.log("🔑 Sitekey:", sitekey);

    if (!widgetRef.current) {
      console.error("❌ widgetRef.current es null");
      return;
    }

    if (typeof window === "undefined") {
      console.error("❌ window is undefined");
      return;
    }

    console.log("✅ Iniciando polling para Turnstile...");

    let attempts = 0;
    const maxAttempts = 40; // 10 segundos máximo

    const interval = setInterval(() => {
      attempts++;

      if (attempts % 4 === 0) {
        console.log(`🔄 Intento ${attempts}/${maxAttempts}, window.turnstile disponible: ${!!window.turnstile}`);
      }

      if (window.turnstile && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(widgetRef.current!, {
            sitekey,
            callback: onSuccess,
            theme: "auto",
          });
          clearInterval(interval);
          console.log("✅ Turnstile widget renderizado exitosamente con ID:", widgetIdRef.current);
        } catch (error) {
          console.error("❌ Error al renderizar Turnstile widget:", error);
          clearInterval(interval);
        }
      } else if (attempts >= maxAttempts) {
        console.error("❌ Timeout: Turnstile no se cargó después de 10 segundos");
        console.error("   window.turnstile disponible:", !!window.turnstile);
        console.error("   widgetIdRef.current:", widgetIdRef.current);
        clearInterval(interval);
      }
    }, 250);

    return () => {
      console.log("🧹 Limpiando TurnstileWidget");
      clearInterval(interval);
    };
  }, [onSuccess, sitekey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => console.log("✅ Script de Turnstile cargado")}
        onError={(e) => console.error("❌ Error al cargar script de Turnstile:", e)}
      />
      <div ref={widgetRef} className={`cf-turnstile w-full ${className}`} />
    </>
  );
}
