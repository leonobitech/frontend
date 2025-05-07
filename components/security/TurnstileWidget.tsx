"use client";

import { useEffect, useState } from "react";

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
}

export function TurnstileWidget({ onSuccess }: TurnstileWidgetProps) {
  const [rendered, setRendered] = useState(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;

  useEffect(() => {
    if (!sitekey || typeof sitekey !== "string") {
      console.error("⚠️ Sitekey inválido o ausente para Turnstile.");
      return;
    }

    const interval = setInterval(() => {
      const el = document.querySelector(".cf-turnstile");
      if (el instanceof HTMLElement && window.turnstile && !rendered) {
        try {
          window.turnstile.render(el, {
            sitekey,
            callback: onSuccess,
          });
          setRendered(true);
          clearInterval(interval);
        } catch (err) {
          console.error("❌ Falló render Turnstile:", err);
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [rendered, onSuccess, sitekey]);

  return <div className="cf-turnstile w-full" />;
}
