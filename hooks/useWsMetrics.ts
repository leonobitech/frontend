// hooks/useWsMetrics.ts
"use client";

import { useEffect, useRef, useState } from "react";

export type WsStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type Metrics = {
  last: number | null;
  avg: number | null;
  min: number | null;
  max: number | null;
  p95: number | null;
  p99: number | null;
  skew: number | null; // ≈ ts_srv - ts_cli - rtt/2
  sent: number;
  recv: number;
  lost: number;
};

function percentile(arr: number[], p: number) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.floor((p / 100) * (sorted.length - 1))
  );
  return sorted[idx]!;
}

type IntervalTimer = ReturnType<typeof setInterval> | null;
type TimeoutTimer = ReturnType<typeof setTimeout> | null;

export function useWsMetrics(opts: {
  url: string;
  getTicket: () => Promise<string | null>;
}) {
  const { url, getTicket } = opts;

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

  const wsRef = useRef<WebSocket | null>(null);
  const pingTimer = useRef<IntervalTimer>(null);
  const reconnectTimer = useRef<TimeoutTimer>(null);

  const pending = useRef<Map<number, number>>(new Map()); // seq -> t0(perf.now)
  const rtts = useRef<number[]>([]);
  const skewRef = useRef<number | null>(null);
  const seqRef = useRef<number>(1);
  const expectedSeq = useRef<number>(1);
  const counters = useRef<{ sent: number; recv: number; lost: number }>({
    sent: 0,
    recv: 0,
    lost: 0,
  });

  const log = (s: string) => setMessages((m) => [...m.slice(-400), s]);

  const recompute = () => {
    const a = rtts.current;
    const { sent, recv, lost } = counters.current;
    if (!a.length) {
      setMetrics({
        last: null,
        avg: null,
        min: null,
        max: null,
        p95: null,
        p99: null,
        skew: skewRef.current,
        sent,
        recv,
        lost,
      });
      return;
    }
    const last = a[a.length - 1]!;
    const min = Math.min(...a);
    const max = Math.max(...a);
    const avg = Math.round(a.reduce((x, y) => x + y, 0) / a.length);
    setMetrics({
      last,
      avg,
      min,
      max,
      p95: percentile(a, 95),
      p99: percentile(a, 99),
      skew: skewRef.current,
      sent,
      recv,
      lost,
    });
  };

  const sendRaw = (msg: string): boolean => {
    const text = msg.trim();
    if (!text) return false;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      log("❌ No hay conexión WS abierta");
      return false;
    }

    ws.send(text);
    log(`📤 ${text}`);
    return true;
  };

  const sendPing = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const seq = seqRef.current++;
    pending.current.set(seq, performance.now());
    counters.current.sent++;
    ws.send(`PING::${Date.now()}::${seq}`);
    setTimeout(() => {
      if (pending.current.has(seq)) {
        pending.current.delete(seq);
        counters.current.lost++;
        recompute();
        log(`⏱️ timeout seq=${seq} (perdido)`);
      }
    }, 10_000);
  };

  const connect = async () => {
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

      // reset estado
      seqRef.current = 1;
      expectedSeq.current = 1;
      counters.current = { sent: 0, recv: 0, lost: 0 };
      pending.current.clear();
      rtts.current = [];
      skewRef.current = null;
      recompute();

      // ping cada 5s
      pingTimer.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) sendPing();
      }, 5000);
    };

    ws.onmessage = (ev: MessageEvent) => {
      const text = typeof ev.data === "string" ? ev.data : "[binary]";

      // PONG::<ts_cli_ms>::<seq>::<ts_srv_ms>
      if (text.startsWith("PONG::")) {
        const parts = text.split("::");
        const tsCli = Number(parts[1]);
        const seq = Number(parts[2]);
        const tsSrv = Number(parts[3]);
        const t0 = pending.current.get(seq);

        if (Number.isFinite(seq) && t0 != null) {
          pending.current.delete(seq);
          counters.current.recv++;

          const rtt = Math.round(performance.now() - t0);
          rtts.current.push(rtt);

          if (Number.isFinite(tsCli) && Number.isFinite(tsSrv)) {
            skewRef.current = Math.round(tsSrv - tsCli - rtt / 2);
          }

          if (seq > expectedSeq.current) {
            counters.current.lost += seq - expectedSeq.current;
          }
          expectedSeq.current = Math.max(expectedSeq.current, seq + 1);

          recompute();
          log(
            `📶 seq=${seq} | RTT=${rtt}ms | skew=${skewRef.current ?? "?"}ms`
          );
          return;
        }
      }

      log(`📩 ${text}`);
    };

    ws.onclose = (ev) => {
      setStatus("closed");
      log(`❌ WS cerrado (code=${ev.code}, reason=${ev.reason || "-"})`);
      if (pingTimer.current) {
        clearInterval(pingTimer.current);
        pingTimer.current = null;
      }
      pending.current.clear();

      if (!reconnectTimer.current) {
        const attempts = Math.min(
          Math.ceil(
            (counters.current.sent +
              counters.current.recv +
              counters.current.lost) /
              5
          ) + 1,
          6
        );
        const delay = Math.pow(2, attempts) * 500;
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

  const disconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
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

  return {
    status,
    metrics,
    messages,
    connect,
    disconnect,
    sendPing,
    sendRaw,
    log, // por si quieres loguear desde afuera
  };
}
