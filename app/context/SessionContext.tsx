// File: app/context/SessionContext.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSessionSecure } from "@/lib/api/fetchSessionSecure";
import type { SessionContextResponse } from "@/types/sessions";

interface SessionContextValue {
  user: SessionContextResponse["user"] | null;
  session: SessionContextResponse["session"] | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  session: null,
  loading: true,
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SessionContextResponse>({
    queryKey: ["session"],
    queryFn: fetchSessionSecure,
    retry: false,
    refetchOnWindowFocus: true, // 🔁 Revalida si cambiás de pestaña
    refetchOnReconnect: true, // 🔌 Revalida si perdés conexión y volvés
    staleTime: 0, // 🧯 Nunca asumas que la sesión está fresca
  });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["session"] });
  };

  return (
    <SessionContext.Provider
      value={{
        user: data?.user ?? null,
        session: data?.session ?? null,
        loading: isLoading,
        refresh,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
