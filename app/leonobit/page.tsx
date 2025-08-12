"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Stats = {
  last: number | null;
  avg: number | null;
  min: number | null;
  max: number | null;
};

export default function LeonobitPage() {
  const DEFAULT_URL =
    process.env.NEXT_PUBLIC_WS_URL ||
    (typeof window !== "undefined" &&
    window.location.hostname.endsWith("leonobitech.com")
      ? "wss://leonobit.leonobitech.com/ws/offer"
      : "ws://localhost:8000/ws/offer");

  const [url, setUrl] = useState<string>(DEFAULT_URL);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "open" | "closed" | "error"
  >("idle");
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingPings = useRef<Map<string, number>>(new Map());
  const rtts = useRef<number[]>([]);
  const [stats, setStats] = useState<Stats>({
    last: null,
    avg: null,
    min: null,
    max: null,
  });

  const log = (s: string) => setMessages((m) => [...m.slice(-200), s]);

  const calcStats = () => {
    const arr = rtts.current;
    if (!arr.length) return { last: null, avg: null, min: null, max: null };
    const last = arr[arr.length - 1];
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    return { last, avg, min, max };
  };

  const connect = async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, "reconnect");
    }
    setStatus("connecting");

    // pide ticket usando cookies (mismo dominio)
    const r = await fetch("/api/ws-ticket", { credentials: "include" });
    if (!r.ok) {
      setStatus("error");
      log("❌ No autorizado (login requerido)");
      return;
    }
    const { token } = await r.json();

    const ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      log(`✅ Conectado a ${url}`);
      pingTimer.current = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
          return;
        const token = `PING::${Date.now()}`;
        pendingPings.current.set(token, performance.now());
        wsRef.current.send(token);
        setTimeout(() => pendingPings.current.delete(token), 10_000);
      }, 5000);
    };

    ws.onmessage = (ev) => {
      const text = typeof ev.data === "string" ? ev.data : "[binary]";
      const match = text.match(/PING::(\d+)/);
      if (match) {
        const token = `PING::${match[1]}`;
        const t0 = pendingPings.current.get(token);
        if (t0) {
          pendingPings.current.delete(token);
          const rtt = Math.round(performance.now() - t0);
          rtts.current.push(rtt);
          setStats(calcStats());
          log(`📶 RTT: ${rtt} ms  | msg: ${text}`);
          return;
        }
      }
      log(`📩 ${text}`);
    };

    ws.onclose = (ev) => {
      setStatus("closed");
      log(`❌ Cerrado (code=${ev.code}, reason=${ev.reason || "-"})`);
      if (pingTimer.current) clearInterval(pingTimer.current);
      pingTimer.current = null;
      pendingPings.current.clear();
    };

    ws.onerror = () => {
      setStatus("error");
      log("⚠️ Error de WebSocket");
    };
  };

  const send = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!input.trim()) return;
    wsRef.current.send(input.trim());
    log(`📤 ${input.trim()}`);
    setInput("");
  };

  const disconnect = () => {
    wsRef.current?.close(1000, "manual");
  };

  useEffect(() => {
    return () => {
      if (pingTimer.current) clearInterval(pingTimer.current);
      wsRef.current?.close(1000, "unmount");
    };
  }, []);

  const statusBadge = useMemo(() => {
    const base = "px-2 py-0.5 rounded text-xs font-mono";
    switch (status) {
      case "open":
        return (
          <span className={`${base} bg-green-100 text-green-800`}>OPEN</span>
        );
      case "connecting":
        return (
          <span className={`${base} bg-yellow-100 text-yellow-800`}>
            CONNECTING
          </span>
        );
      case "error":
        return <span className={`${base} bg-red-100 text-red-800`}>ERROR</span>;
      case "closed":
        return (
          <span className={`${base} bg-gray-200 text-gray-800`}>CLOSED</span>
        );
      default:
        return (
          <span className={`${base} bg-gray-100 text-gray-600`}>IDLE</span>
        );
    }
  }, [status]);

  return (
    <div className="font-sans p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">WebSocket Latency Test</h1>
      <p className="mb-4 text-gray-600">
        Mide RTT mediante mensajes <code>PING::timestamp</code> que el servidor
        ecoa.
      </p>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="wss://leonobit.leonobitech.com/ws/offer"
          className="w-full p-2 rounded-lg border border-gray-300 font-mono"
        />
        <div className="flex gap-2">
          <button
            onClick={connect}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-black text-white"
          >
            Conectar
          </button>
          <button
            onClick={disconnect}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
          >
            Desconectar
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        Estado: {statusBadge}
        <div className="ml-auto flex gap-3">
          <Stat label="last" value={stats.last} />
          <Stat label="avg" value={stats.avg} />
          <Stat label="min" value={stats.min} />
          <Stat label="max" value={stats.max} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje para eco…"
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="w-full p-2 rounded-lg border border-gray-300 font-mono"
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
        >
          Enviar
        </button>
      </div>

      <pre className="mt-4 bg-gray-900 text-blue-100 p-4 rounded-lg min-h-[240px] max-h-[420px] overflow-y-auto whitespace-pre-wrap break-words border border-gray-800">
        {messages.join("\n")}
      </pre>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-bold">
        {value !== null ? `${value} ms` : "—"}
      </div>
    </div>
  );
}
