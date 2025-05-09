// File: app/context/SessionContext.tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSession } from "@/lib/api/account";
import type { SessionContextResponse } from "@/types/sessions";

// -----------------------------------------------------------------------------
// 🧠 Contexto global de sesión
// Este provider permite acceder a los datos de sesión autenticada (`user`, `session`)
// en cualquier componente de la app sin tener que hacer múltiples fetch.
// Usa `@tanstack/react-query` para manejar el cache y la refetch logic.
// -----------------------------------------------------------------------------

// Tipado del contexto
interface SessionContextValue {
  user: SessionContextResponse["user"] | null;
  session: SessionContextResponse["session"] | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

// ⚙️ Inicialización del contexto con valores por defecto
const SessionContext = createContext<SessionContextValue>({
  user: null,
  session: null,
  loading: true,
  refresh: async () => {},
});

// 🧩 Provider que envuelve la app y expone el contexto
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // 📦 Hook de react-query que maneja la llamada a `/api/auth/session`
  const { data, isLoading } = useQuery<SessionContextResponse>({
    queryKey: ["session"], // 🏷️ Clave para el cache
    queryFn: fetchSession, // 📡 Función que ejecuta el fetch (ya comentada aparte)
    retry: false, // 🚫 No reintenta si falla (podrías cambiarlo si querés tolerancia a errores)
    refetchOnWindowFocus: false, // 💤 Evita que se refetchee al cambiar de pestaña
  });

  // 🔁 Refresca la sesión manualmente invalidando el cache
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["session"] });
  };

  // ✅ Proveemos los valores del contexto a toda la app
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

// 🪝 Hook personalizado para consumir fácilmente el contexto
export function useSession() {
  return useContext(SessionContext);
}
