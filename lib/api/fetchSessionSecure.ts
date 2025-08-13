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

  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}
