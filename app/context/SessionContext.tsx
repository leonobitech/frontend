// File: app/context/SessionContext.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSessionSecure } from "@/lib/api/fetchSessionSecure";
import type { SessionContextResponse } from "@/types/sessions";

// 🔧 Tipo extendido de usuario
export type ExtendedSessionUser = SessionContextResponse["user"] & {
  displayName: string;
  roleLabel: string;
  isAdmin: boolean;
  isVerified: boolean;
};

// 🧠 Tipo del contexto global
interface SessionContextValue {
  user: ExtendedSessionUser | null;
  session: SessionContextResponse["session"] | null;
  loading: boolean;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
}

// 🌍 Contexto default
const SessionContext = createContext<SessionContextValue>({
  user: null,
  session: null,
  loading: true,
  refresh: async () => {},
  isAuthenticated: false,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // 🧠 Query React Query → revalidar sesión proactivamente para mantener tokens frescos
  const { data, isLoading } = useQuery<SessionContextResponse>({
    queryKey: ["session"],
    queryFn: fetchSessionSecure,
    retry: 1, // ✅ Reintentar 1 vez en caso de error temporal
    retryDelay: 1000, // ⏱️ Esperar 1 segundo antes de reintentar
    refetchOnWindowFocus: true, // ✅ Revalidar cuando el usuario vuelve a la pestaña (trigger silent refresh si expiró)
    refetchOnReconnect: true, // 🔌 Revalida si perdés conexión y volvés
    refetchInterval: 5 * 60 * 1000, // 🔄 Polling cada 5 minutos para mantener sesión viva (antes de que expire el token de 15 min)
    refetchIntervalInBackground: false, // ⚡ No hacer polling si la pestaña está en background (ahorra batería/recursos)
    staleTime: 60 * 1000, // ⏱️ Considerar fresca por 1 minuto (permite refresh más frecuente sin duplicados)
  });

  // 🔁 Refresca manualmente
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["session"] });
  };

  // 🧱 Mapping del usuario para frontend
  const mappedUser: ExtendedSessionUser | null = data?.user
    ? {
        ...data.user,
        displayName: data.user.name || data.user.email,
        roleLabel:
          data.user.role === "admin"
            ? "Administrador"
            : data.user.role === "moderator"
            ? "Moderador"
            : data.user.role === "user"
            ? "Usuario"
            : "Invitado",
        isAdmin: data.user.role === "admin",
        isVerified: data.user.verified,
      }
    : null;

  return (
    <SessionContext.Provider
      value={{
        user: mappedUser,
        session: data?.session ?? null,
        loading: isLoading,
        refresh,
        isAuthenticated: !!data?.user && !!data?.session,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
