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
    if (!widgetRef.current || typeof window === "undefined") return;

    let attempts = 0;
    const maxAttempts = 40; // 10 segundos máximo

    const interval = setInterval(() => {
      attempts++;

      if (window.turnstile && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(widgetRef.current!, {
            sitekey,
            callback: onSuccess,
            theme: "auto",
          });
          clearInterval(interval);
        } catch (error) {
          console.error("Error al renderizar Turnstile:", error);
          clearInterval(interval);
        }
      } else if (attempts >= maxAttempts) {
        console.error("Turnstile no se cargó. Verifica que el sitekey sea válido y que no haya bloqueadores activos.");
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [onSuccess, sitekey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div className={`flex justify-center ${className}`}>
        <div ref={widgetRef} className="cf-turnstile" />
      </div>
    </>
  );
}
