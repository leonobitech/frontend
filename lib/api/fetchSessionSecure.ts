// File: lib/api/fetchSessionSecure.ts
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { SessionContextResponse } from "@/types/sessions";

export async function fetchSessionSecure(): Promise<SessionContextResponse> {
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const meta = buildClientMetaWithResolution(screenResolution, {
    label: "leonobitech",
  });

  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 🔐 Usamos include para enviar solo cookies válidas (accessKey + clientKey)
    body: JSON.stringify({ meta }),
  });

  if (!res.ok) {
    // Solo errores reales (5xx, etc.) - 401/403 ahora devuelven 200 con null
    throw new Error("Session fetch failed");
  }
  return res.json();
}
