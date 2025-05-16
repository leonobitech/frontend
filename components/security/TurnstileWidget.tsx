import Script from "next/script";
import { useEffect, useRef } from "react";

// TurnstileWidget.tsx
type Props = {
  onSuccess: (token: string) => void;
  sitekey: string;
};

export function TurnstileWidget({ onSuccess, sitekey }: Props) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!widgetRef.current || typeof window === "undefined") return;

    const interval = setInterval(() => {
      if (window.turnstile && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(widgetRef.current!, {
          sitekey, // ✅ uso seguro
          callback: onSuccess,
          theme: "auto",
        });
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [onSuccess, sitekey]);

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
