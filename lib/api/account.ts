// lib/api/account.ts
import { buildClientMeta } from "@/lib/clientMeta";
import { SessionContextResponse } from "@/types/sessions";

export async function fetchSession(): Promise<SessionContextResponse> {
  const partialMeta = buildClientMeta();
  const screenResolution =
    typeof window !== "undefined"
      ? `${window.screen.width}x${window.screen.height}`
      : "unknown";

  const meta = { ...partialMeta, screenResolution };

  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ meta }),
  });

  if (!res.ok) throw new Error("Unauthorized");

  return res.json();
}
