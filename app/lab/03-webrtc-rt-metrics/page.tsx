"use client";

/**
 * Lab 03 — WebRTC RT Metrics (Cliente)
 *
 * Flujo:
 * 1) El cliente crea un RTCPeerConnection y un DataChannel "rt-metrics".
 * 2) Genera una offer SDP y la envía a nuestro API interno: /api/lab/03-webrtc-metrics
 *    - El API (server) valida sesión en Core, emite un JWT (iss=lab-03,aud=lab-webrtc-03-metrics)
 *      y reenvía la offer al backend Axum con Bearer + Origin correcto.
 * 3) El API devuelve la answer SDP. La seteamos como remoteDescription.
 * 4) El DataChannel queda operativo: el servidor envía PING y ECHO; el cliente mide RTT con ECHO.
 *
 * Notas:
 * - No usamos variables de entorno del cliente. Todo fetch a servicios externos lo hace el App Router (server).
 * - Reusamos StatusBadge, Controls y StatsGridRT existentes.
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

type Status = "idle" | "connecting" | "open" | "closed" | "error";

/** Helper seguro para formatear errores sin `any` */
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
  const { user, session, loading } = useSessionGuard();

  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<string[]>([]);
  const [rtts, setRtts] = useState<number[]>([]);
  const [input, setInput] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const tickRef = useRef<number | null>(null);

  /** Calculamos métricas simples en cliente a partir de la ventana de RTTs */
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

  /** Señalización completa vía API server-side */
  async function connect() {
    setStatus("connecting");
    try {
      // 1) PC + DC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });
      pcRef.current = pc;

      const dc = pc.createDataChannel("rt-metrics");
      dcRef.current = dc;

      // 2) DataChannel handlers
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

      // 3) Offer local
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 4) Meta del cliente (usa helper → sin warning de unused)
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const meta = buildClientMetaWithResolution(screenRes, {
        label: "leonobitech",
      });

      // 5) Señalización vía API server (no exponde secretos/envs)
      const res = await fetch("/api/lab/03-webrtc-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meta,
          user,
          session,
          offer: { type: "offer", sdp: offer.sdp },
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => `${res.status}`);
        throw new Error(`Signaling failed: ${msg}`);
      }

      const ans = (await res.json()) as { sdp: string; type: string };
      await pc.setRemoteDescription({ type: "answer", sdp: ans.sdp });

      // 6) PING cliente opcional cada 1s (además del PING del server)
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

  function pushMsg(m: string) {
    setMessages((arr) => {
      const next = [...arr, m];
      if (next.length > 500) next.shift();
      return next;
    });
  }

  // Cleanup al desmontar
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
        Señalización por <code>HTTP POST</code> (Bearer JWT) → DataChannel{" "}
        <code>rt-metrics</code> con PING/ECHO para RTT.
      </p>

      {/* La URL del control es referencial (UI). La conexión real la hace el API server. */}
      <Controls
        url={"https://leonobit.leonobitech.com/webrtc/lab/03/offer"}
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
