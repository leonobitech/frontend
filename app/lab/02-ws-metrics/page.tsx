// app/lab/02-ws-metrics/page.tsx
"use client";

import { useState } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { resolveWsUrl } from "@/lib/ws";
import { useWsMetrics } from "@/hooks/useWsMetrics";
import { StatusBadge } from "@/components/labs/ws/StatusBadge";
import { StatsGrid } from "@/components/labs/ws/StatsGrid";
import { Controls } from "@/components/labs/ws/Controls";

export default function Lab02WsMetricsPage() {
  const WS_URL = resolveWsUrl("lab-02");
  const { user, session, loading } = useSessionGuard();

  const [url, setUrl] = useState<string>(WS_URL);
  const [input, setInput] = useState("");

  const getTicket = async (): Promise<string | null> => {
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const meta = {
      ...buildClientMetaWithResolution(screenRes, {
        label: "lab-02-ws-metrics",
      }),
      path: "/lab/02-ws-metrics",
      method: "POST",
    } as const;

    const r = await fetch("/api/lab/02-ws-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ meta, user, session }),
    });

    if (!r.ok) return null;
    const data = await r.json().catch(() => null);
    return (data?.token as string) ?? null;
  };

  const { status, metrics, messages, connect, disconnect, sendPing, sendRaw } =
    useWsMetrics({ url, getTicket });

  const sendText = () => {
    const text = input.trim();
    if (!text) return;
    const ok = sendRaw(text);
    if (ok) setInput("");
  };

  return (
    <div className="font-sans p-6 max-w-4xl mx-auto">
      {/* ─────────────────────────────
       Encabezado y descripción del laboratorio
       ───────────────────────────── */}
      <h1 className="text-2xl font-bold mb-1">Lab 02 — WS Metrics</h1>
      <p className="mb-4 text-gray-600">
        Ping/Pong real: <code>PING::ts_cli::seq</code> →{" "}
        <code>PONG::ts_cli::seq::ts_srv</code>. Calcula RTT, skew y pérdidas con
        percentiles.
      </p>

      {/* ─────────────────────────────
       Controles de conexión WebSocket
       - URL editable
       - Botones de conectar / desconectar / ping
       ───────────────────────────── */}
      <Controls
        url={url}
        setUrl={setUrl}
        onConnect={() => connect()}
        onDisconnect={() => disconnect()}
        onPing={() => sendPing()}
        disabled={loading || status === "connecting"}
        placeholder={WS_URL}
      />

      {/* ─────────────────────────────
       Estado actual + métricas en tiempo real
       ───────────────────────────── */}
      <div className="mt-3 flex items-center gap-3">
        Estado: <StatusBadge status={status} />
        <StatsGrid m={metrics} />
      </div>

      {/* ─────────────────────────────
       Envío manual de mensajes (modo eco)
       - Campo de texto
       - Botón de envío
       ───────────────────────────── */}
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="(Opcional) escribe texto para eco"
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

      {/* ─────────────────────────────
       Log de mensajes recibidos/enviados
       - Scroll automático
       - Mantiene formato con pre-wrap
       ───────────────────────────── */}
      <pre className="mt-4 bg-gray-900 text-blue-100 p-4 rounded-lg min-h-[280px] max-h-[460px] overflow-y-auto whitespace-pre-wrap break-words border border-gray-800">
        {messages.join("\n")}
      </pre>
    </div>
  );
}
