// File: src/hooks/useCleanCookies.ts
"use client";

import { useEffect } from "react";

export function useCleanCookies() {
  useEffect(() => {
    const keep = [
      "accessKey",
      "clientKey",
      "sidebar_state",
      "clientMeta",
      "__next_hmr_refresh_hash__",
    ];
    const cookies = document.cookie.split(";").map((c) => c.trim());

    cookies.forEach((cookie) => {
      const name = cookie.split("=")[0];

      if (!keep.includes(name)) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
        console.warn("🍪 Cookie eliminada post-render:", name);
      }
    });
  }, []);
}
