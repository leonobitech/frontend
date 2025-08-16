"use client";

/**
 * Lab 03 — WebRTC RT Metrics (cliente)
 * Señalización HTTP (JWT) → RTCPeerConnection + DataChannel "rt-metrics"
 * Modo no-trickle (espera ICE gathering antes de enviar el offer)
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
import { WsStatus } from "@/hooks/useWsMetrics";

type Status =
  | "idle"
  | "connecting"
  | "open"
  | "disconnected"
  | "closed"
  | "failed"
  | "error";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

async function waitIceGatheringComplete(
  pc: RTCPeerConnection,
  timeoutMs = 3500
): Promise<{
  completed: boolean;
  sdp: string | null;
  seen: { host: number; srflx: number; relay: number; mdns: number };
}> {
  let timer: number | null = null;
  const seen = { host: 0, srflx: 0, relay: 0, mdns: 0 };

  pc.onicecandidate = (ev) => {
    const c = ev.candidate?.candidate;
    if (!c) return;
    if (c.includes(" typ host")) seen.host++;
    if (c.includes(" typ srflx")) seen.srflx++;
    if (c.includes(" typ relay")) seen.relay++;
    if (c.includes(".local")) seen.mdns++;
  };

  // Usado y logueado (evita warning de lint)
  pc.onicecandidateerror = (ev) => {
    console.error(
      "❌ ICE candidate error:",
      ev.errorCode,
      ev.errorText,
      ev.url
    );
  };

  if (pc.iceGatheringState === "complete") {
    return { completed: true, sdp: pc.localDescription?.sdp ?? null, seen };
  }

  const completed = await new Promise<boolean>((resolve) => {
    const onState = () => {
      if (pc.iceGatheringState === "complete") {
        if (timer) window.clearTimeout(timer);
        pc.removeEventListener("icegatheringstatechange", onState);
        resolve(true);
      }
    };
    pc.addEventListener("icegatheringstatechange", onState);

    timer = window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", onState);
      resolve(false);
    }, timeoutMs);
  });

  return { completed, sdp: pc.localDescription?.sdp ?? null, seen };
}

function sdpHasSrflx(sdp: string | null): boolean {
  if (!sdp) return false;
  return /a=candidate:.*\styp\s+srflx\b/m.test(sdp);
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

  function pushMsg(m: string) {
    setMessages((arr) => {
      const next = [...arr, m];
      if (next.length > 500) next.shift();
      return next;
    });
  }

  function attachChannel(dc: RTCDataChannel) {
    dcRef.current = dc;

    dc.onopen = () => {
      setStatus("open");
      pushMsg("📡 DataChannel abierto");
    };

    dc.onclose = () => {
      setStatus("closed");
      pushMsg("🔌 DataChannel cerrado");
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };

    dc.onerror = (ev) => {
      const msg =
        (ev as unknown as { error?: { message?: string } })?.error?.message ??
        getErrorMessage(ev);
      setStatus("error");
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
          return;
        }
        pushMsg("MSG ← " + ev.data);
      } catch {
        pushMsg("RAW ← " + String(ev.data));
      }
    };
  }

  async function connect() {
    if (status === "connecting" || status === "open") return;

    setStatus("connecting");
    try {
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const meta = {
        ...buildClientMetaWithResolution(screenRes, { label: "leonobitech" }),
        path: "/lab/03-webrtc-rt-metrics",
        method: "POST",
      } as const;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun.cloudflare.com:3478"] },
        ],
      });
      pcRef.current = pc;

      // Mapea estados del peer para sincronizar la UI
      pc.oniceconnectionstatechange = () => {
        pushMsg(`ICE state → ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === "failed") setStatus("failed");
        else if (pc.iceConnectionState === "disconnected")
          setStatus("disconnected");
      };
      pc.onconnectionstatechange = () => {
        pushMsg(`PC state → ${pc.connectionState}`);
        if (pc.connectionState === "failed") setStatus("failed");
        if (pc.connectionState === "disconnected") setStatus("disconnected");
        if (pc.connectionState === "closed") setStatus("closed");
      };

      // *** IMPORTANTE ***
      // El servidor crea el DataChannel "rt-metrics".
      // Por eso aquí NO creamos canal: escuchamos el que llega del servidor.
      pc.ondatachannel = (ev) => {
        const dc = ev.channel;
        if (dc.label === "rt-metrics") {
          pushMsg("🔔 ondatachannel ← 'rt-metrics'");
          attachChannel(dc);
        } else {
          // si el server agregara otros canales en el futuro
          pushMsg(`🔔 ondatachannel ← '${dc.label}' (no usado)`);
        }
      };

      // Offer + setLocal
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Esperar ICE gathering para que el offer lleve srflx en SDP
      const waited = await waitIceGatheringComplete(pc, 3500);

      const localSdp = waited.sdp ?? pc.localDescription?.sdp ?? null;
      if (!localSdp) throw new Error("No local SDP after ICE gathering");

      const hasSrflx = sdpHasSrflx(localSdp);
      pushMsg(
        `ICE gathered: completed=${waited.completed} | host=${waited.seen.host} mdns=${waited.seen.mdns} srflx=${waited.seen.srflx} relay=${waited.seen.relay} | SDP has srflx=${hasSrflx}`
      );

      // Señalización → tu API
      const resp = await fetch("/api/lab/03-webrtc-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meta,
          user,
          session,
          offer: { type: "offer", sdp: localSdp },
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(
          `Signaling failed: ${resp.status} ${errBody?.message ?? ""}`
        );
      }

      const answer = (await resp.json()) as { sdp: string; type: string };
      await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });

      // Auto-PING cada 1s (si existe canal y está abierto)
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => {
        const dc = dcRef.current;
        if (!dc || dc.readyState !== "open") return;
        try {
          dc.send(JSON.stringify({ kind: "PING", t: Date.now() }));
        } catch (e) {
          pushMsg("⚠️ Envío PING auto fallido: " + getErrorMessage(e));
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
    dcRef.current = null;
    pcRef.current = null;
    tickRef.current = null;
    setStatus("closed");
    pushMsg("🔌 Desconectado");
  }

  function sendText() {
    const txt = input.trim();
    const dc = dcRef.current;
    if (!txt || !dc || dc.readyState !== "open") return;
    try {
      dc.send(txt);
      pushMsg("RAW → " + txt);
      setInput("");
    } catch (e) {
      pushMsg("⚠️ Envío fallido: " + getErrorMessage(e));
    }
  }

  function sendPingManual() {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    const ts = Date.now();
    try {
      dc.send(JSON.stringify({ kind: "PING", t: ts }));
      pushMsg("👆 PING manual → " + new Date(ts).toLocaleTimeString());
    } catch (e) {
      pushMsg("⚠️ PING manual fallido: " + getErrorMessage(e));
    }
  }

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
        Señalización por <code>HTTP</code> (JWT) → DataChannel{" "}
        <code>rt-metrics</code> con PING/ECHO. No-trickle ICE (el offer incluye
        candidatos STUN).
      </p>

      <Controls
        url={"https://leonobit.leonobitech.com/webrtc/lab/03/offer"}
        setUrl={() => {}}
        onConnect={connect}
        onDisconnect={disconnect}
        onPing={sendPingManual}
        disabled={loading || status === "connecting"}
        placeholder={"/webrtc/lab/03/offer"}
      />

      <div className="mt-3 flex items-center gap-3">
        Estado: <StatusBadge status={status as WsStatus} />
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
