// File: lib/api/fetchSessionSecure.ts
import { buildClientMeta } from "@/lib/clientMeta";
import { SessionContextResponse } from "@/types/sessions";

export async function fetchSessionSecure(): Promise<SessionContextResponse> {
  const partialMeta = buildClientMeta();
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const meta = { ...partialMeta, screenResolution };

  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 🔐 Usamos include para enviar solo cookies válidas (accessKey + clientKey)
    body: JSON.stringify({ meta }),
  });

  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}
