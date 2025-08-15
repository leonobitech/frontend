// src/hooks/useWsMetrics.ts
"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export type WsStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type Metrics = {
  last: number | null; // RTT último (ms)
  avg: number | null; // RTT promedio (ms)
  min: number | null; // RTT min (ms)
  max: number | null; // RTT max (ms)
  p95: number | null; // RTT p95 (ms)
  p99: number | null; // RTT p99 (ms)
  skew: number | null; // (ts_srv_recv - ts_cli) estimación de offset (ms)
  sent: number; // PING enviados
  recv: number; // PONG recibidos válidos
  lost: number; // perdidos detectados por seq
};

type Options = {
  url: string;
  getTicket: () => Promise<string | null>;
  // Tamaño máx. buffer de RTTs para percentiles
  windowSize?: number;
};

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function useWsMetrics({ url, getTicket, windowSize = 300 }: Options) {
  const wsRef = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState<WsStatus>("idle");
  const [messages, setMessages] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    last: null,
    avg: null,
    min: null,
    max: null,
    p95: null,
    p99: null,
    skew: null,
    sent: 0,
    recv: 0,
    lost: 0,
  });

  // buffers & contadores
  const seqRef = useRef<number>(0);
  const expectSeqRef = useRef<number | null>(null);
  const rttsRef = useRef<number[]>([]);
  const reconnectingRef = useRef(false);

  const pushLog = useCallback((line: string) => {
    setMessages((prev) => [...prev.slice(-400), line]);
  }, []);

  const computeStats = useCallback(() => {
    const arr = rttsRef.current;
    if (!arr.length) {
      setMetrics((m) => ({
        ...m,
        last: null,
        avg: null,
        min: null,
        max: null,
        p95: null,
        p99: null,
      }));
      return;
    }
    const last = arr[arr.length - 1];
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    const sorted = [...arr].sort((a, b) => a - b);
    const p95 = Math.round(quantile(sorted, 0.95));
    const p99 = Math.round(quantile(sorted, 0.99));
    setMetrics((m) => ({ ...m, last, avg, min, max, p95, p99 }));
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, "reconnect");
    }

    setStatus("connecting");
    pushLog(`⏳ Obteniendo ticket…`);
    const token = await getTicket();
    if (!token) {
      setStatus("error");
      pushLog("❌ No se pudo obtener token (401/errores previos)");
      return;
    }

    const ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      pushLog(`✅ Conectado a ${url}`);
      // reset métricas por nueva sesión
      rttsRef.current = [];
      seqRef.current = 0;
      expectSeqRef.current = null;
      setMetrics((m) => ({
        ...m,
        last: null,
        avg: null,
        min: null,
        max: null,
        p95: null,
        p99: null,
        skew: null,
        sent: 0,
        recv: 0,
        lost: 0,
      }));
    };

    ws.onmessage = (ev) => {
      const now = Date.now();
      const raw = typeof ev.data === "string" ? ev.data : "[binary]";
      pushLog(`📩 ${raw}`);

      // PONG::<ts_cli>::<seq>::<ts_srv_recv>::<ts_srv_send>
      if (typeof ev.data === "string" && raw.startsWith("PONG::")) {
        const parts = raw.split("::");
        // Soportamos 4 campos (nuevo) y 3 (viejo)
        // idx: 0    1        2     3            4
        //      PONG ts_cli   seq   ts_srv_recv  ts_srv_send
        const tsCli = Number(parts[1] ?? NaN);
        const seq = Number(parts[2] ?? NaN);
        const tsSrvRecv = Number(parts[3] ?? NaN);
        const tsSrvSend = Number(parts[4] ?? NaN);

        if (!Number.isFinite(tsCli) || !Number.isFinite(seq)) return;

        // pérdidas desde el punto de vista del cliente
        if (expectSeqRef.current !== null && seq > expectSeqRef.current) {
          const lostHere = seq - expectSeqRef.current;
          setMetrics((m) => ({ ...m, lost: m.lost + lostHere }));
        }
        expectSeqRef.current = seq + 1;

        // RTT aproximado (cliente)
        const rtt = now - tsCli;
        rttsRef.current.push(rtt);
        if (rttsRef.current.length > windowSize) {
          rttsRef.current.shift();
        }

        // skew ≈ diferencia de reloj (lado server recibió - ts_cli)
        const skew = Number.isFinite(tsSrvRecv)
          ? tsSrvRecv - tsCli
          : (now - tsCli) / 2;

        // server processing (solo si tenemos ambos)
        const srvProc =
          Number.isFinite(tsSrvRecv) && Number.isFinite(tsSrvSend)
            ? Math.max(0, tsSrvSend - tsSrvRecv)
            : null;

        setMetrics((m) => ({
          ...m,
          recv: m.recv + 1,
          skew: Math.round(skew),
        }));
        computeStats();

        // línea “bonita”
        const pretty = `📶 seq=${seq} | RTT=${rtt}ms | skew=${Math.round(
          skew
        )}ms${srvProc !== null ? ` | srvProc=${srvProc}ms` : ""}`;
        pushLog(pretty);
        return;
      }
    };

    ws.onclose = (ev) => {
      setStatus("closed");
      pushLog(
        `🔻 Close code=${ev.code} reason=${ev.reason || "-"} (url=${url})`
      );
      if (!reconnectingRef.current && ev.code !== 1000) {
        // opcional: backoff aquí si quisieras un auto-reconnect
      }
    };

    ws.onerror = () => {
      setStatus("error");
      pushLog("⚠️ Error de WebSocket");
    };
  }, [url, getTicket, pushLog, computeStats, windowSize]);

  const disconnect = useCallback(() => {
    wsRef.current?.close(1000, "manual");
  }, []);

  const sendPing = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const seq = ++seqRef.current;
    const ts = Date.now(); // ms epoch
    const line = `PING::${ts}::${seq}`;
    ws.send(line);
    pushLog(`📤 ${line}`);

    setMetrics((m) => ({ ...m, sent: m.sent + 1 }));
    if (expectSeqRef.current === null) {
      expectSeqRef.current = seq;
    }
  }, [pushLog]);

  const sendRaw = useCallback(
    (text: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(text);
      pushLog(`📤 ${text}`);
      return true;
    },
    [pushLog]
  );

  return useMemo(
    () => ({
      status,
      metrics,
      messages,
      connect,
      disconnect,
      sendPing,
      sendRaw,
      log: pushLog, // por si quieres loguear eventos desde fuera
    }),
    [status, metrics, messages, connect, disconnect, sendPing, sendRaw, pushLog]
  );
}
