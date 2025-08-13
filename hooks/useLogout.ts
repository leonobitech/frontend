// File: hooks/useLogout.ts
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  buildClientMetaWithResolution,
  type RequestMeta,
} from "@/lib/clientMeta";

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
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const res = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ meta }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message);
      }

      // 🧠 Extra: podrías logear la sesión revocada (debug)
      console.info("🧾 Logout:", {
        userId: result.data?.userId,
        sessionId: result.data?.sessionId,
        status: result.status,
        timestamp: result.timestamp,
      });

      // 🔁 Invalidate cache y redirect
      await queryClient.setQueryData(["session"], null);
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/");
      router.refresh();
      // ✅ Logout exitoso
      toast.success(result.message || "Sesión cerrada correctamente");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
}
