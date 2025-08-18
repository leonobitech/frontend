"use client";

/**
 * Lab 04 — WebRTC Audio (loopback)
 * - Captura micrófono y lo envía al backend.
 * - El backend hace RTP-forwarding (eco) y devuelve el audio.
 * - Reproducimos la pista remota para validar media end-to-end.
 */

import { useEffect, useRef, useState } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

type Status = "idle" | "connecting" | "open" | "closed" | "error";

/** Espera a que el ICE gathering termine o corta por timeout. */
async function waitIceGatheringComplete(
  pc: RTCPeerConnection,
  timeoutMs = 1200
): Promise<void> {
  if (pc.iceGatheringState === "complete") return;
  await new Promise<void>((resolve) => {
    const onState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", onState);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", onState);
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", onState);
      resolve();
    }, timeoutMs);
  });
}

/** Type guards para stats (evita `any`). */
function isOutboundAudio(r: RTCStats): r is RTCOutboundRtpStreamStats {
  return (
    r.type === "outbound-rtp" &&
    (r as RTCOutboundRtpStreamStats).kind === "audio"
  );
}
function isInboundAudio(r: RTCStats): r is RTCInboundRtpStreamStats {
  return (
    r.type === "inbound-rtp" && (r as RTCInboundRtpStreamStats).kind === "audio"
  );
}

/** Logger simple de stats para verificar tráfico IN/OUT de audio. */
function startStatsWatcher(pc: RTCPeerConnection) {
  const timer = setInterval(async () => {
    if (pc.connectionState === "closed") {
      clearInterval(timer);
      return;
    }
    const stats = await pc.getStats();

    let outAudio: RTCOutboundRtpStreamStats | undefined;
    let inAudio: RTCInboundRtpStreamStats | undefined;

    stats.forEach((r) => {
      if (isOutboundAudio(r)) outAudio = r;
      if (isInboundAudio(r)) inAudio = r;
    });

    if (outAudio) {
      console.log("↑ outbound-audio", {
        packetsSent: outAudio.packetsSent,
        bytesSent: outAudio.bytesSent,
      });
    }
    if (inAudio) {
      console.log("↓ inbound-audio", {
        packetsReceived: inAudio.packetsReceived,
        bytesReceived: inAudio.bytesReceived,
      });
    }
  }, 1000);
  return () => clearInterval(timer);
}

export default function Lab04WebRTCAudioPage() {
  const { user, session, loading } = useSessionGuard();

  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const stopStatsRef = useRef<(() => void) | null>(null);

  async function connect() {
    setErr(null);
    setStatus("connecting");

    // Limpieza por si había una sesión previa
    try {
      pcRef.current?.close();
    } catch {}
    if (stopStatsRef.current) stopStatsRef.current();
    pcRef.current = null;

    try {
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const meta = {
        ...buildClientMetaWithResolution(screenRes, { label: "leonobitech" }),
        path: "/lab/04-webrtc-audio",
        method: "POST",
      } as const;

      // 1) Capturar micrófono (solo audio)
      const local = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = local;

      // 2) Crear PeerConnection + STUN públicos
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun.cloudflare.com:3478"] },
        ],
      });
      pcRef.current = pc;

      // Logs básicos ICE/PC
      pc.oniceconnectionstatechange = () => {
        console.log("ICE →", pc.iceConnectionState);
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        )
          setStatus("closed");
      };
      pc.onconnectionstatechange = () => {
        console.log("PC →", pc.connectionState);
        if (pc.connectionState === "connected") setStatus("open");
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed" ||
          pc.connectionState === "disconnected"
        )
          setStatus("closed");
      };
      pc.onicecandidateerror = (ev) => console.warn("ICE error:", ev);

      // 3) Forzar m-line de audio y enviar mic
      pc.addTransceiver("audio", { direction: "sendrecv" });
      for (const track of local.getAudioTracks()) {
        pc.addTrack(track, local);
        track.enabled = true;
      }

      // 4) Asignar la pista remota directo al <audio> (con fallback)
      pc.ontrack = (ev) => {
        const el = remoteAudioRef.current;
        if (!el) return;

        const remoteStream = ev.streams?.[0] ?? new MediaStream([ev.track]);

        // Limpieza defensiva antes de adjuntar
        try {
          (el as HTMLMediaElement).srcObject = null;
        } catch {}
        el.srcObject = remoteStream;

        el.autoplay = true;
        el.muted = false;
        el.volume = 1.0;

        // En algunos entornos (Safari / permisos recientes) hace falta este layout “después del click”
        el.play().catch((err) => {
          console.warn("Autoplay bloqueado; hacer click manual en ▶️:", err);
        });

        console.log("ontrack:", {
          kind: ev.track.kind,
          id: ev.track.id,
          streamsLen: ev.streams?.length ?? 0,
          muted: ev.track.muted,
          enabled: ev.track.enabled,
          readyState: ev.track.readyState,
        });
      };

      // 5) Offer local → esperar algo de ICE → señalización
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      await waitIceGatheringComplete(pc, 1200);

      const resp = await fetch("/api/lab/04-webrtc-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meta,
          user,
          session,
          offer: { type: "offer", sdp: pc.localDescription?.sdp ?? "" },
        }),
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(`Signaling failed: ${resp.status} ${msg}`);
      }

      const answer = (await resp.json()) as { sdp: string; type: string };
      await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });

      // 6) Stats watcher para confirmar tráfico de audio IN/OUT
      stopStatsRef.current = startStatsWatcher(pc);

      setStatus("open");
    } catch (e) {
      setStatus("error");
      setErr(e instanceof Error ? e.message : String(e));
      try {
        pcRef.current?.close();
      } catch {}
      if (stopStatsRef.current) stopStatsRef.current();
      pcRef.current = null;
    }
  }

  function hardDisconnect() {
    const pc = pcRef.current;
    if (pc) {
      pc.getSenders?.().forEach((s) => {
        try {
          s.replaceTrack?.(null);
        } catch {}
        try {
          pc.removeTrack?.(s);
        } catch {}
      });
      pc.getTransceivers?.().forEach((t) => {
        try {
          t.stop?.();
        } catch {}
      });
      try {
        pc.close();
      } catch {}
      pcRef.current = null;
    }
    if (stopStatsRef.current) stopStatsRef.current();

    const local = localStreamRef.current;
    if (local) {
      local.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      localStreamRef.current = null;
    }

    const el = remoteAudioRef.current;
    if (el) {
      try {
        el.pause();
      } catch {}
      try {
        (el as HTMLMediaElement).srcObject = null;
      } catch {}
      try {
        (el as HTMLMediaElement).removeAttribute("src");
        el.load();
      } catch {}
    }
  }

  function disconnect() {
    hardDisconnect();
    setStatus("closed");
  }

  useEffect(() => {
    return () => {
      hardDisconnect();
    };
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Lab 04 — WebRTC Audio (Loopback)</h1>
      <p className="text-gray-600 mb-4">
        Envía micrófono → backend → eco RTP → reproduce audio remoto.
      </p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={connect}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          disabled={loading || status === "connecting" || status === "open"}
        >
          Conectar
        </button>
        <button
          onClick={disconnect}
          className="px-4 py-2 rounded-lg border border-gray-300"
          disabled={status !== "open" && status !== "connecting"}
        >
          Desconectar
        </button>
        <span className="ml-2">
          Estado: <b>{status}</b>
        </span>
      </div>

      {err && (
        <pre className="bg-red-950 text-red-100 p-3 rounded mb-3">{err}</pre>
      )}

      <div className="space-y-2">
        <div className="text-sm text-gray-500">
          Audio remoto (eco desde el servidor):
        </div>
        <audio ref={remoteAudioRef} controls autoPlay />
      </div>
    </div>
  );
}
