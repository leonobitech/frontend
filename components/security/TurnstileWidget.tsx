// File: components/security/TurnstileWidget.tsx
"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type Props = {
  onSuccess: (token: string) => void;
};

export function TurnstileWidget({ onSuccess }: Props) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!widgetRef.current || typeof window === "undefined") return;

    const interval = setInterval(() => {
      if (window.turnstile && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(widgetRef.current!, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY!,
          callback: onSuccess,
          theme: "auto",
        });
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [onSuccess]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <div ref={widgetRef} className="cf-turnstile" />
    </>
  );
}
