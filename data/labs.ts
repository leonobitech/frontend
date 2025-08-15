import type { IconKey } from "@/components/ui/icons";

export type LabStatus = "ready" | "wip" | "soon";
export type LabKind = "websocket" | "webrtc" | "auth" | "metrics" | "infra";

export type LabItem = {
  id: string; // slug único
  title: string; // título visible
  description: string; // breve copy
  path: string; // ruta interna del Next.js o link externo
  kind: LabKind; // categoría para filtrar/ordenar
  status: LabStatus; // estado del lab
  badges?: string[]; // etiquetas cortas
  order?: number; // prioridad en el grid
  featured?: boolean; // sube de tamaño o posición
  icon?: IconKey; // nombre de ícono (lucide)
};

export const LABS: LabItem[] = [
  {
    id: "01-ws-auth",
    title: "01 — WS Auth",
    description: "Handshake WebSocket con JWT y mensajes auth/echo/ping.",
    path: "/lab/01-ws-auth",
    kind: "auth",
    status: "ready",
    badges: ["JWT", "Axum", "Next.js"],
    order: 1,
    featured: true,
    icon: "Shield",
  },
  {
    id: "02-ws-metrics",
    title: "02 — WS Metrics",
    description: "RTT, pings y métricas en vivo desde el backend.",
    path: "/lab/02-ws-metrics",
    kind: "metrics",
    status: "ready",
    badges: ["RTT", "Tracing"],
    order: 2,
    icon: "Activity",
  },
  {
    id: "03-webrtc-audio",
    title: "03 — WebRTC Audio",
    description: "Señalización básica y media stream con audio.",
    path: "/lab/03-webrtc-audio",
    kind: "webrtc",
    status: "wip",
    badges: ["SDP", "ICE"],
    order: 3,
    icon: "Mic",
  },
  {
    id: "04-infra-traefik",
    title: "04 — Infra Traefik",
    description: "Enrutado TLS, headers y healthchecks para los labs.",
    path: "/lab/04-infra-traefik",
    kind: "infra",
    status: "wip",
    badges: ["TLS", "Docker"],
    order: 4,
    icon: "Server",
  },
  {
    id: "05-auth-ui",
    title: "05 — Auth UI",
    description: "Login/logout, sesión, control de dispositivo en UI.",
    path: "/lab/05-auth-ui",
    kind: "auth",
    status: "soon",
    badges: ["Session", "Device"],
    order: 5,
    icon: "UserCheck",
  },
];
