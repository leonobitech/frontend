// lib/ws.ts
const ENDPOINTS: Record<string, string> = {
  "lab-01": "/ws/lab-01",
  "lab-02": "/ws/lab-02",
  leonobit: "/ws/offer",
};

export function resolveWsUrl(key: keyof typeof ENDPOINTS) {
  const origin =
    process.env.NEXT_PUBLIC_WS_ORIGIN ||
    (typeof window !== "undefined" &&
    window.location.hostname.endsWith("leonobitech.com")
      ? "wss://leonobit.leonobitech.com"
      : "ws://localhost:8000");

  return `${origin}${ENDPOINTS[key]}`;
}
