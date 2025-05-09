// File: lib/api/account.ts

import { buildClientMeta } from "@/lib/clientMeta";
import { SessionContextResponse } from "@/types/sessions";

// -----------------------------------------------------------------------------
// 🔁 Función: fetchSession()
// Dispara una solicitud POST al endpoint interno `/api/auth/session`
// que a su vez reenvía al backend real (`/account/me`).
//
// Se usa para obtener la sesión activa del usuario junto con metadata
// de su dispositivo (IP, userAgent, sistema operativo, etc.).
//
// El resultado se usa en el context global (SessionContext) para saber si
// el usuario está autenticado, desde qué dispositivo y en qué condiciones.
//
// ✔️ En producción, este endpoint también valida la IP y bloquea privadas.
// -----------------------------------------------------------------------------

export async function fetchSession(): Promise<SessionContextResponse> {
  // 🧠 Obtención de metadatos del navegador (parciales)
  const partialMeta = buildClientMeta();

  // 📺 Agregamos resolución de pantalla del cliente si existe `window`
  const screenResolution =
    typeof window !== "undefined"
      ? `${window.screen.width}x${window.screen.height}`
      : "unknown";

  // 📦 Composición final del objeto `meta` con todos los datos
  const meta = { ...partialMeta, screenResolution };

  // 🔐 Enviamos el meta al endpoint local `/api/auth/session`
  // que se encarga de validar IPs, enriquecer la request y reenviarla al backend.
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Importante para que se envíen las cookies httpOnly
    body: JSON.stringify({ meta }),
  });

  // ❌ Si el backend responde con error (403, 401, etc.), disparamos excepción
  if (!res.ok) throw new Error("Unauthorized");

  // ✅ Si todo va bien, devolvemos el objeto completo: { user, session }
  return res.json();
}
