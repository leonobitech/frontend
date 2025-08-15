"use client";

/**
 * Lab 03 — WebRTC RT Metrics (cliente)
 *
 * ▶ Señalización vía API interna (App Router): POST /api/lab/03-webrtc-metrics
 *    - La API server-side valida sesión, emite JWT y reenvía la offer al backend Axum
 *    - El cliente NUNCA toca secretos ni URLs del backend; sin NEXT_PUBLIC_*
 * ▶ RTCPeerConnection + DataChannel "rt-metrics"
 * ▶ El servidor envía PING/ECHO; también enviamos PING cliente para medir RTT
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

/** Estados de la conexión del DataChannel para UI */
type Status = "idle" | "connecting" | "open" | "closed" | "error";

/** Helper para errores sin any */
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
  // Guard de sesión (mismo patrón que lab-02)
  const { user, session, loading } = useSessionGuard();

  // Estado / log
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<string[]>([]);
  const [rtts, setRtts] = useState<number[]>([]);
  const [input, setInput] = useState("");

  // Refs para objetos WebRTC y timer
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const tickRef = useRef<number | null>(null);

  /** Calcula métricas simples en cliente a partir de la ventana de RTTs */
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

  /** Señalización completa a través de la API interna (server-side) */
  async function connect() {
    setStatus("connecting");
    try {
      // 1) Crear PC + DC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });
      pcRef.current = pc;

      const dc = pc.createDataChannel("rt-metrics");
      dcRef.current = dc;

      // Eventos DC
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
        const msg =
          (ev as unknown as { error?: { message?: string } })?.error?.message ??
          getErrorMessage(ev);
        pushMsg("⚠️ DC error: " + msg);
      };

      // Medición RTT con ECHO del server
      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.kind === "ECHO" && typeof msg.t === "number") {
            const rtt = Math.abs(Date.now() - msg.t);
            setRtts((arr) => {
              const next = [...arr, rtt];
              if (next.length > 2000) next.shift();
              return next;
            });
            pushMsg(`ECHO ← ${rtt.toFixed(1)} ms`);
          } else {
            pushMsg("MSG ← " + ev.data);
          }
        } catch {
          pushMsg("RAW ← " + String(ev.data));
        }
      };

      // 2) Offer local
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 3) Señalización vía API interna (App Router)
      //    - La API valida sesión, emite JWT (iss/aud de lab-03), llama a Axum y devuelve answer.
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const meta = {
        ...buildClientMetaWithResolution(screenRes, { label: "leonobitech" }),
        path: "/lab/03-webrtc-rt-metrics",
        method: "POST",
      } as const;

      const res = await fetch("/api/lab/03-webrtc-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // importante: para que la API pueda validar sesión
        body: JSON.stringify({
          meta,
          user,
          session,
          offer: { type: "offer", sdp: offer.sdp },
        }),
      });

      if (!res.ok) throw new Error(`Signaling failed: ${res.status}`);
      const ans = (await res.json()) as { sdp: string; type: string };

      // 4) Answer remoto
      await pc.setRemoteDescription({ type: "answer", sdp: ans.sdp });

      // 5) PING opcional desde cliente (además de PING del server)
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

  /** Cierra DC/PC y limpia timer */
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

  /** Envío manual raw por DC (debug/eco) */
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

  /** Log */
  function pushMsg(m: string) {
    setMessages((arr) => {
      const next = [...arr, m];
      if (next.length > 500) next.shift();
      return next;
    });
  }

  /** Cleanup on unmount */
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
      <h1 className="text-2xl font-bold mb-1">Lab 03 — WebRTC RT Metrics</h1>
      <p className="mb-4 text-gray-600">
        Señalización vía <code>API interna</code> (Bearer JWT emitido en server)
        → DataChannel <code>rt-metrics</code> con PING/ECHO para RTT.
      </p>

      {/* Reusamos controles visuales del lab-02; la URL es referencial */}
      <Controls
        url={"/api/lab/03-webrtc-metrics"}
        setUrl={() => {}}
        onConnect={connect}
        onDisconnect={disconnect}
        onPing={() => {
          try {
            dcRef.current?.send(
              JSON.stringify({ kind: "PING", t: Date.now() })
            );
          } catch {}
        }}
        disabled={loading || status === "connecting"}
        placeholder={"/api/lab/03-webrtc-metrics"}
      />

      <div className="mt-3 flex items-center gap-3">
        Estado: <StatusBadge status={status} />
        <StatsGridRT m={metrics} />
      </div>

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

      <pre className="mt-4 bg-gray-900 text-blue-100 p-4 rounded-lg min-h-[280px] max-h-[460px] overflow-y-auto whitespace-pre-wrap break-words border border-gray-800">
        {messages.join("\n")}
      </pre>
    </div>
  );
}
