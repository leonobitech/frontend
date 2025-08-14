// lib/ws.ts
export const WS_ROUTES = {
  leonobit: "/ws/leonobit/offer",
  "lab-01": "/ws/lab/01/offer",
  "lab-02": "/ws/lab/02/offer",
} as const;

export type WsKey = keyof typeof WS_ROUTES;

function joinOriginPath(origin: string, path: string) {
  const o = origin.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${o}${p}`;
}

export function resolveWsUrl(key: WsKey): string {
  const path = WS_ROUTES[key];

  // 1) Preferir var de entorno pública (prod/staging)
  const origin = process.env.NEXT_PUBLIC_WS_ORIGIN;
  if (origin) return joinOriginPath(origin, path);

  // 2) Fallback a host actual (dev/local)
  if (typeof window !== "undefined") {
    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    const currentOrigin = `${scheme}://${window.location.host}`;
    return joinOriginPath(currentOrigin, path);
  }

  // 3) SSR/Edge sin window: devolver la ruta (el caller puede completarla)
  return path;
}
