// File: components/security/TurnstileWidget.tsx
"use client";

import { useEffect, useState } from "react";

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
}

export function TurnstileWidget({ onSuccess }: TurnstileWidgetProps) {
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const el = document.querySelector(".cf-turnstile");
      if (el instanceof HTMLElement && window.turnstile && !rendered) {
        window.turnstile.render(el, {
          sitekey: "0x4AAAAAABYn3-YQQUmFVajM",
          callback: onSuccess,
        });
        setRendered(true);
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [rendered, onSuccess]);

  return <div className="cf-turnstile w-full" />;
}
