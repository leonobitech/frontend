"use client";

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
  timeoutMs = 3500
): Promise<{ completed: boolean; sdp: string | null }> {
  let timer: number | null = null;

  if (pc.iceGatheringState === "complete") {
    return { completed: true, sdp: pc.localDescription?.sdp ?? null };
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

  return { completed, sdp: pc.localDescription?.sdp ?? null };
}

export default function Lab03WebRTCMetricsPage() {
  const { user, session, loading } = useSessionGuard();

  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<string[]>([]);
  const [rtts, setRtts] = useState<number[]>([]);
  const [input, setInput] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const metrics: MetricsRT | null = useMemo(() => {
    if (rtts.length === 0) return null;
    const sorted = [...rtts].sort((a, b) => a - b);
    const q = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))];
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    return {
      count: rtts.length,
      min: sorted[0],
      p50: q(0.5),
      p90: q(0.9),
      p95: q(0.95),
      p99: q(0.99),
      max: sorted[sorted.length - 1],
      mean,
    };
  }, [rtts]);

  const pushMsg = (m: string) =>
    setMessages((arr) => {
      const next = [...arr, m];
      if (next.length > 500) next.shift();
      return next;
    });

  async function connect() {
    // Limpieza dura antes de crear otro PC
    try {
      dcRef.current?.close();
    } catch {}
    try {
      pcRef.current?.close();
    } catch {}
    dcRef.current = null;
    pcRef.current = null;

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

      pc.oniceconnectionstatechange = () => {
        pushMsg(`ICE → ${pc.iceConnectionState}`);
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          setStatus("closed");
        }
      };
      pc.onconnectionstatechange = () => {
        pushMsg(`PC → ${pc.connectionState}`);
      };
      pc.onicecandidateerror = (ev: RTCPeerConnectionIceErrorEvent) => {
        pushMsg(
          `❌ ICE error: code=${ev?.errorCode} text=${ev?.errorText} url=${
            ev?.url ?? ""
          }`
        );
      };

      // DataChannel NEGOCIADO (id:0) — debe coincidir con el server
      const dc = pc.createDataChannel("rt-metrics", {
        negotiated: true,
        id: 0,
      });
      dcRef.current = dc;

      dc.onopen = () => {
        setStatus("open");
        pushMsg("📡 DC abierto");
      };
      dc.onclose = () => {
        setStatus("closed");
        pushMsg("🔌 DC cerrado");
      };
      dc.onerror = (ev) => {
        const msg =
          (ev as unknown as { error?: { message?: string } })?.error?.message ??
          getErrorMessage(ev);
        setStatus("error");
        pushMsg("⚠️ DC error: " + msg);
      };

      // Solo ECHO (el server hace PING cada 1s)
      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (
            (msg.kind === "PING" || msg.kind === "ECHO") &&
            typeof msg.t === "number"
          ) {
            // RTT (cliente) entre ahora y t de origen
            const rtt = Math.abs(Date.now() - msg.t);
            setRtts((arr) => {
              const next = [...arr, rtt];
              if (next.length > 2000) next.shift();
              return next;
            });
            pushMsg(`${msg.kind} ← ${rtt.toFixed(1)} ms`);
            // responder siempre con ECHO del mismo t
            try {
              dc.send(JSON.stringify({ kind: "ECHO", t: msg.t }));
            } catch (e) {
              pushMsg("⚠️ ECHO fallido: " + getErrorMessage(e));
            }
            return;
          }
          pushMsg("MSG ← " + ev.data);
        } catch {
          pushMsg("RAW ← " + String(ev.data));
        }
      };

      // SDP: offer local (con gather completo)
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      const waited = await waitIceGatheringComplete(pc, 4000);
      const localSdp = waited.sdp ?? pc.localDescription?.sdp ?? null;
      if (!localSdp)
        throw new Error("No local SDP available after ICE gathering");

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

      pushMsg("✅ Conectado (negotiated DC id=0)");
    } catch (e) {
      setStatus("error");
      pushMsg("❌ Error de conexión: " + getErrorMessage(e));
      // asegúrate de dejar limpio si falla
      try {
        dcRef.current?.close();
      } catch {}
      try {
        pcRef.current?.close();
      } catch {}
      dcRef.current = null;
      pcRef.current = null;
    }
  }

  function disconnect() {
    try {
      dcRef.current?.close();
    } catch {}
    try {
      pcRef.current?.close();
    } catch {}
    dcRef.current = null;
    pcRef.current = null;
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

  useEffect(() => {
    return () => {
      try {
        dcRef.current?.close();
      } catch {}
      try {
        pcRef.current?.close();
      } catch {}
      dcRef.current = null;
      pcRef.current = null;
    };
  }, []);

  return (
    <div className="font-sans p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Lab 03 — WebRTC RT Metrics</h1>
      <p className="mb-4 text-gray-600">
        Señalización HTTP (JWT) → DataChannel <code>rt-metrics</code> negociado
        (id=0). Server envía PING; cliente responde ECHO.
      </p>

      <Controls
        url={"https://leonobit.leonobitech.com/webrtc/lab/03/offer"}
        setUrl={() => {}}
        onConnect={connect}
        onDisconnect={disconnect}
        onPing={() => {
          try {
            // Ping manual (opcional)
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
