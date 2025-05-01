"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { buildClientMeta } from "@/lib/clientMeta";
import type { SessionContextResponse } from "@/types/sessions";

interface SessionContextValue {
  user: SessionContextResponse["user"] | null;
  session: SessionContextResponse["session"] | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  session: null,
  loading: true,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      // 🧠 Construcción del meta
      const partialMeta = buildClientMeta();
      const screenResolution =
        typeof window !== "undefined"
          ? `${window.screen.width}x${window.screen.height}`
          : "unknown";

      const meta = {
        ...partialMeta,
        screenResolution,
      };

      const res = await fetch("/api/account/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ meta }),
      });

      if (!res.ok) throw new Error("Unauthorized");

      return res.json() as Promise<SessionContextResponse>;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <SessionContext.Provider
      value={{
        user: data?.user ?? null,
        session: data?.session ?? null,
        loading: isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
