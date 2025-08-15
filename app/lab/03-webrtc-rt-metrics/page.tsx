"use client";

/**
 * Lab 03 — WebRTC RT Metrics (cliente)
 *
 * ▶ Señalización por HTTP POST a /webrtc/lab/03/offer (con Authorization: Bearer <token>)
 * ▶ Establece un RTCPeerConnection y crea un DataChannel "rt-metrics"
 * ▶ El servidor envía PING cada 1s; el cliente también envía PING (opcional) y recibe ECHO
 * ▶ A partir de ECHO mide RTT (en ms) y actualiza un pequeño panel de estadísticas (min/mean/p50/.../max)
 *
 * Notas:
 * - Reusamos componentes visuales del lab-02: StatusBadge, Controls, Stat.
 * - NO usamos la URL de Controls para conectar WS; acá la conexión es por fetch (HTTP) + DataChannel.
 * - Token JWT (iss: lab-03, aud: lab-webrtc-03-metrics) se obtiene con /api/lab/03-webrtc-metrics
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

import { StatusBadge } from "@/components/labs/ws/StatusBadge";
import { Controls } from "@/components/labs/ws/Controls";
import {
  StatsGridRT,
  type MetricsRT,
} from "@/components/labs/webrtc/StatsGridRT";

/** Estados de la conexión del DataChannel para mostrar en UI */
type Status = "idle" | "connecting" | "open" | "closed" | "error";

/** Helper para tipar bien errores sin usar `any` */
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export default function Lab03WebRTCMetricsPage() {
  // Guard de sesión (reuso del lab-02)
  const { user, session, loading } = useSessionGuard();

  // Estado de conexión + log simple en pantalla
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<string[]>([]);

  // Ventana de RTTs (en ms) para calcular percentiles client-side
  const [rtts, setRtts] = useState<number[]>([]);

  // Input para enviar mensajes raw por el DataChannel (debug/eco)
  const [input, setInput] = useState("");

  // Refs para objetos WebRTC y timer
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const tickRef = useRef<number | null>(null);

  /**
   * Métricas (min, mean, p50, p90, p95, p99, max, count) a partir de la ventana `rtts`.
   * Importante:
   * - La UI no exige precisión estadística perfecta; esto es un estimador simple en cliente.
   * - El backend ya agrega percentiles “fuertes” con HDRHistogram (servidor).
   */
  const metrics: MetricsRT | null = useMemo(() => {
    if (rtts.length === 0) return null;

    const sorted = [...rtts].sort((a, b) => a - b);
    const pick = (q: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))];
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;

    return {
      count: rtts.length,
      min: sorted[0],
      p50: pick(0.5),
      p90: pick(0.9),
      p95: pick(0.95),
      p99: pick(0.99),
      max: sorted[sorted.length - 1],
      mean,
    };
  }, [rtts]);

  /**
   * Pide un "ticket" (JWT) al backend Next.js para este lab:
   * - Endpoint: /api/lab/03-webrtc-metrics
   * - Internamente valida sesión en Core y firma un JWT con iss/aud del lab-03
   * - Este token se utiliza como Bearer en el POST de señalización
   */
  const getTicket = async (): Promise<string | null> => {
    try {
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const meta = {
        ...buildClientMetaWithResolution(screenRes, { label: "leonobitech" }),
        path: "/lab/03-webrtc-rt-metrics",
        method: "POST",
      } as const;

      const r = await fetch("/api/lab/03-webrtc-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ meta, user, session }),
      });
      if (!r.ok) return null;

      const data = (await r.json().catch(() => null)) as {
        token?: string;
      } | null;
      return data?.token ?? null;
    } catch {
      return null;
    }
  };

  /**
   * Conecta el PeerConnection y el DataChannel "rt-metrics".
   * Flujo de señalización:
   * 1) createOffer + setLocalDescription
   * 2) POST /webrtc/lab/03/offer con Authorization: Bearer <token>
   * 3) setRemoteDescription(answer)
   * 4) A partir de aquí, el DataChannel queda operativo para PING/ECHO
   */
  async function connect() {
    setStatus("connecting");
    try {
      // 1) Obtener token Bearer para este lab
      const token = await getTicket();
      if (!token) throw new Error("No se pudo obtener ticket");

      // 2) Crear RTCPeerConnection + DataChannel
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });
      pcRef.current = pc;

      const dc = pc.createDataChannel("rt-metrics");
      dcRef.current = dc;

      // 3) Eventos del DataChannel
      dc.onopen = () => {
        setStatus("open");
        pushMsg("📡 DC abierto");
      };
      dc.onclose = () => {
        setStatus("closed");
        pushMsg("🔌 DC cerrado");
      };
      dc.onerror = (ev) => {
        setStatus("error");
        // RTCDataChannel.onerror no siempre provee un RTCErrorEvent estándar
        const msg =
          (ev as unknown as { error?: { message?: string } })?.error?.message ??
          getErrorMessage(ev);
        pushMsg("⚠️ DC error: " + msg);
      };

      // El servidor enviará PINGs y ECHOs. Aquí medimos RTT con ECHO.
      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.kind === "ECHO" && typeof msg.t === "number") {
            const rtt = Math.abs(Date.now() - msg.t); // RTT aprox (ms)
            setRtts((arr) => {
              const next = [...arr, rtt];
              // ventana deslizante (capamos para no crecer infinito)
              if (next.length > 2000) next.shift();
              return next;
            });
            pushMsg(`ECHO ← ${rtt.toFixed(1)} ms`);
          } else {
            pushMsg("MSG ← " + ev.data);
          }
        } catch {
          // si no es JSON, lo mostramos raw
          pushMsg("RAW ← " + String(ev.data));
        }
      };

      // 4) Offer local
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 5) Señalización HTTP con Bearer JWT hacia el backend Axum (endpoint fijo)
      const API = process.env.NEXT_PUBLIC_API_ORIGIN!;

      const res = await fetch(`${API}/webrtc/lab/03/offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ← acá va el JWT
        },
        body: JSON.stringify({ type: "offer", sdp: offer.sdp }),
      });
      if (!res.ok) throw new Error(`Signaling failed: ${res.status}`);
      const ans = (await res.json()) as { sdp: string; type: string };

      // 6) Answer remoto
      await pc.setRemoteDescription({ type: "answer", sdp: ans.sdp });

      // 7) (Opcional) PING desde cliente cada 1s (además del PING servidor)
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => {
        try {
          dc.send(JSON.stringify({ kind: "PING", t: Date.now() }));
        } catch (e) {
          pushMsg("⚠️ Envío PING fallido: " + getErrorMessage(e));
        }
      }, 1000);

      pushMsg("✅ Conectado");
    } catch (e) {
      setStatus("error");
      pushMsg("❌ Error de conexión: " + getErrorMessage(e));
    }
  }

  /** Cierra DataChannel y PeerConnection, y limpia el timer de PING */
  function disconnect() {
    try {
      if (tickRef.current) window.clearInterval(tickRef.current);
    } catch {}
    try {
      dcRef.current?.close();
    } catch {}
    try {
      pcRef.current?.close();
    } catch {}

    tickRef.current = null;
    setStatus("closed");
    pushMsg("🔌 Desconectado");
  }

  /** Envía texto raw por el DataChannel (útil para pruebas de eco server-side) */
  function sendText() {
    const txt = input.trim();
    if (!txt || !dcRef.current || dcRef.current.readyState !== "open") return;
    try {
      dcRef.current.send(txt);
      pushMsg("RAW → " + txt);
      setInput("");
    } catch (e) {
      pushMsg("⚠️ Envío fallido: " + getErrorMessage(e));
    }
  }

  /** Agrega una línea al log de mensajes (con cap para evitar crecer infinito) */
  function pushMsg(m: string) {
    setMessages((arr) => {
      const next = [...arr, m];
      if (next.length > 500) next.shift();
      return next;
    });
  }

  /** Cleanup al desmontar la página (cierra DC/PC y el interval) */
  useEffect(() => {
    return () => {
      try {
        if (tickRef.current) window.clearInterval(tickRef.current);
      } catch {}
      try {
        dcRef.current?.close();
      } catch {}
      try {
        pcRef.current?.close();
      } catch {}
    };
  }, []);

  return (
    <div className="font-sans p-6 max-w-4xl mx-auto">
      {/* ───────────────────────────────────────────────────────────────
          Encabezado y breve descripción del flujo
      ─────────────────────────────────────────────────────────────── */}
      <h1 className="text-2xl font-bold mb-1">Lab 03 — WebRTC RT Metrics</h1>
      <p className="mb-4 text-gray-600">
        Señalización por <code>HTTP POST</code> (Bearer JWT) → DataChannel{" "}
        <code>rt-metrics</code> con PING/ECHO para RTT.
      </p>

      {/* ───────────────────────────────────────────────────────────────
          Controles (reuso del lab-02).
          Importante: la URL aquí es meramente referencial para UI.
          La conexión real ocurre via fetch a /webrtc/lab/03/offer
      ─────────────────────────────────────────────────────────────── */}
      <Controls
        url={"https://leonobit.leonbitech.com/webrtc/lab/03/offer"}
        setUrl={() => {}}
        onConnect={() => connect()}
        onDisconnect={() => disconnect()}
        onPing={() => {
          try {
            dcRef.current?.send(
              JSON.stringify({ kind: "PING", t: Date.now() })
            );
          } catch {}
        }}
        disabled={loading || status === "connecting"}
        placeholder={"/webrtc/lab/03/offer"}
      />

      {/* ───────────────────────────────────────────────────────────────
          Estado y métricas calculadas en cliente (simple estimador)
      ─────────────────────────────────────────────────────────────── */}
      <div className="mt-3 flex items-center gap-3">
        Estado: <StatusBadge status={status} />
        <StatsGridRT m={metrics} />
      </div>

      {/* ───────────────────────────────────────────────────────────────
          Envío manual de mensajes raw por DataChannel (opcional)
      ─────────────────────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="(Opcional) mensaje raw por DataChannel"
          onKeyDown={(e) => e.key === "Enter" && sendText()}
          className="w-full p-2 rounded-lg border border-gray-300 font-mono"
        />
        <button
          onClick={sendText}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-900 text-white"
        >
          Enviar
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────
          Log de mensajes/estados (ayuda a ver PING/ECHO y errores)
      ─────────────────────────────────────────────────────────────── */}
      <pre className="mt-4 bg-gray-900 text-blue-100 p-4 rounded-lg min-h-[280px] max-h-[460px] overflow-y-auto whitespace-pre-wrap break-words border border-gray-800">
        {messages.join("\n")}
      </pre>
    </div>
  );
}
