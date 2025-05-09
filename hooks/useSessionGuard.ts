// File: app/hooks/useSessionGuard.ts
"use client";

import { useSession } from "@/app/context/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// -----------------------------------------------------------------------------
// 🛡️ useSessionGuard()
// Hook personalizado para proteger rutas/clientes que requieren autenticación.
// Si el usuario o la sesión no están presentes, redirige automáticamente.
//
// 🔁 Se basa en el contexto global de sesión (`useSession()`)
// y la navegación del App Router (`useRouter()`)
//
// Opciones disponibles:
//  - `redirectTo`: ruta a la que redirige si no hay sesión (por default: /login)
//  - `skipIfLoading`: evita la redirección mientras `loading === true`
// -----------------------------------------------------------------------------

type Options = {
  redirectTo?: string;
  skipIfLoading?: boolean;
};

export function useSessionGuard({
  redirectTo = "/login",
  skipIfLoading = true,
}: Options = {}) {
  const { user, session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 💤 Si estamos cargando sesión y se pidió omitir mientras carga → no hacer nada
    if (skipIfLoading && loading) return;

    // 🔐 Si no hay sesión válida → redirigimos a login (u otro destino)
    if (!user || !session) {
      router.replace(redirectTo);
    }
  }, [user, session, loading, redirectTo, skipIfLoading, router]);

  // ✅ Retorna estado de sesión para usar en componentes si hace falta
  return { user, session, loading };
}
