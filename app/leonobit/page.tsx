// app/leonobit/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

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

  const { user, session, loading } = useSessionGuard();

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
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const [stats, setStats] = useState<Stats>({
    last: null,
    avg: null,
    min: null,
    max: null,
  });

  // 👉 resolución de pantalla (solo en cliente)
  const [screenResolution, setScreenResolution] = useState<string>("");
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

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

  const getTicket = async (): Promise<string | null> => {
    // 🧠 meta del cliente (sin IP; la inyecta la API route)
    const meta = buildClientMetaWithResolution(screenResolution, {
      label: "leonobitech",
    });

    const r = await fetch("/api/leonobit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // cookies para Core
      body: JSON.stringify({
        meta,
        // 👇 mandamos lo que ya tenemos del guard para firmar el token
        user,
        session,
      }),
    });

    if (!r.ok) {
      const { message } = await r.json().catch(() => ({ message: "" }));
      log(`❌ WS ticket error ${message ? `| ${message}` : ""}`);
      return null;
    }

    const data = await r.json().catch(() => null);
    const token = data?.token as string | undefined;
    if (!token) {
      log("❌ WS ticket: no llegó 'token' en la respuesta");
      return null;
    }
    return token;
  };

  const connect = async () => {
    if (loading) {
      log("⏳ Esperando sesión…");
      return;
    }
    if (!user || !session) {
      setStatus("error");
      log("❌ No hay sesión disponible (useSessionGuard)");
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, "reconnect");
    }

    setStatus("connecting");
    const token = await getTicket();
    if (!token) {
      setStatus("error");
      return;
    }

    const ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      log(`✅ Conectado a ${url}`);
      reconnectAttempts.current = 0;
      // PING periódico
      pingTimer.current = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
          return;
        const t = `PING::${Date.now()}`;
        pendingPings.current.set(t, performance.now());
        wsRef.current.send(t);
        setTimeout(() => pendingPings.current.delete(t), 10_000);
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

      // 🔁 Reintento básico con backoff (opcional)
      if (!reconnectTimer.current) {
        const attempt = Math.min(reconnectAttempts.current + 1, 6);
        reconnectAttempts.current = attempt;
        const delay = Math.pow(2, attempt) * 500; // 0.5s,1s,2s,4s,8s,16s máx
        log(`↻ Reintentando en ${Math.round(delay)} ms…`);
        reconnectTimer.current = setTimeout(() => {
          reconnectTimer.current = null;
          connect();
        }, delay);
      }
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
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    wsRef.current?.close(1000, "manual");
  };

  useEffect(() => {
    return () => {
      if (pingTimer.current) clearInterval(pingTimer.current);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
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
        Doble validación: Core + sesión local. Mide RTT con{" "}
        <code>PING::timestamp</code>.
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
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-900 text-white disabled:opacity-60"
          >
            {loading ? "Cargando sesión…" : "Conectar"}
          </button>
          <button
            onClick={disconnect}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-900 text-white"
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
          className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-900 text-white"
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
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-bold text-white">
        {value !== null ? `${value} ms` : "—"}
      </div>
    </div>
  );
}
