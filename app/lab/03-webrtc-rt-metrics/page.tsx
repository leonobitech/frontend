"use client";

/**
 * Lab 03 — WebRTC RT Metrics (cliente)
 *
 * ▶ Señalización vía /api/lab/03-webrtc-metrics
 * ▶ RTCPeerConnection + DataChannel "rt-metrics"
 * ▶ PING/ECHO con RTT calculado
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
  timeoutMs = 3000
) {
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
  pc.onicecandidateerror = (ev) => {
    console.error("❌ ICE candidate error:", ev.errorCode, ev.errorText);
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

  async function connect() {
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

      const dc = pc.createDataChannel("rt-metrics");
      dcRef.current = dc;

      dc.onopen = () => {
        setStatus("open");
        pushMsg("📡 DataChannel abierto");
      };
      dc.onclose = () => {
        setStatus("closed");
        pushMsg("🔌 DataChannel cerrado");
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

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const waited = await waitIceGatheringComplete(pc, 3500);
      const localSdp = waited.sdp ?? pc.localDescription?.sdp ?? null;
      if (!localSdp) throw new Error("No local SDP after ICE gathering");

      const hasSrflx = sdpHasSrflx(localSdp);
      pushMsg(
        `ICE gathered: completed=${waited.completed} | host=${waited.seen.host} mdns=${waited.seen.mdns} srflx=${waited.seen.srflx} relay=${waited.seen.relay} | SDP has srflx=${hasSrflx}`
      );

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
      if (!resp.ok) throw new Error(`Signaling failed ${resp.status}`);
      const answer = (await resp.json()) as { sdp: string; type: string };
      await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });

      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => {
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

  // 👇 Nuevo: PING manual
  function sendPingManual() {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    const ts = Date.now();
    try {
      dcRef.current.send(JSON.stringify({ kind: "PING", t: ts }));
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
        Señalización por <code>HTTP</code> → DataChannel <code>rt-metrics</code>{" "}
        con PING/ECHO. ICE no-trickle.
      </p>

      <Controls
        url={"https://leonobit.leonobitech.com/webrtc/lab/03/offer"}
        setUrl={() => {}}
        onConnect={() => connect()}
        onDisconnect={() => disconnect()}
        onPing={sendPingManual} // 👈 botón PING manual
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
