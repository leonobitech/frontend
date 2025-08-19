import type { IconKey } from "@/components/ui/icons";

export type LabStatus = "ready" | "wip" | "soon";
export type LabKind = "websocket" | "webrtc" | "ai" | "metrics" | "infra";

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
    kind: "websocket",
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
    title: "03 — WebRTC",
    description: "Señalización HTTP (ICE/PC/DC + RTT metrics).",
    path: "/lab/03-webrtc-rt-metrics",
    kind: "webrtc",
    status: "ready",
    badges: ["SDP", "ICE"],
    order: 3,
    icon: "Server",
  },
  {
    id: "04-webrtc-audio",
    title: "04 — WebRTC Audio",
    description: "WebRTC Audio (loopback) base.",
    path: "/lab/04-webrtc-audio",
    kind: "webrtc",
    status: "ready",
    badges: ["RTP", "ASR/TTS"],
    order: 4,
    icon: "Mic",
  },
  {
    id: "05-voice-native-ai",
    title: "05 — Voice Native AI",
    description: "Human-like conversations with no ASR lag.",
    path: "/lab/05-voice-native-ai",
    kind: "ai",
    status: "soon",
    badges: ["Session", "Device"],
    order: 5,
    icon: "UserCheck",
  },
];
