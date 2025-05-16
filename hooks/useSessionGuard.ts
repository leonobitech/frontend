// File: app/hooks/useSessionGuard.ts
"use client";

import { useSession } from "@/app/context/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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
  redirectTo = "/",
  skipIfLoading = true,
}: Options = {}) {
  const { user, session, loading } = useSession();
  const router = useRouter();

  const redirectedRef = useRef(false); // 🧠 Evita múltiples redirecciones

  useEffect(() => {
    // 💤 No hacemos nada mientras carga, si se pidió saltar
    if (skipIfLoading && loading) return;

    const noSession = !user || !session;

    // 🔁 Redirigimos si no hay sesión y aún no redirigimos antes
    if (noSession && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(redirectTo);
    }

    // 🧼 Si la sesión vuelve, reseteamos el flag
    if (!noSession) {
      redirectedRef.current = false;
    }
  }, [user, session, loading, redirectTo, skipIfLoading, router]);

  return { user, session, loading };
}
