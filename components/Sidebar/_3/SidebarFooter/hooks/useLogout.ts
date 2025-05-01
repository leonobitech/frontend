// File: hooks/useLogout.ts
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { buildClientMeta, type RequestMeta } from "@/lib/clientMeta";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [screenResolution, setScreenResolution] = useState("");

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      const meta: RequestMeta = {
        ...buildClientMeta(),
        screenResolution,
      };

      const res = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ meta }),
      });

      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["session"] });
        router.push("/login");
        router.refresh();
      } else {
        const err = await res.json();
        console.error("❌ Logout failed:", err);
      }
    } catch (err) {
      console.error("❌ Error al cerrar sesión:", err);
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
}
