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

export default function Lab04WebRTCAudioPage() {
  // Sesión protegida: necesitamos user/session para firmar el JWT server-side
  const { user, session, loading } = useSessionGuard();

  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  async function connect() {
    setErr(null);
    setStatus("connecting");

    // Limpieza defensiva por si había una sesión previa
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    try {
      // Meta de cliente (para observabilidad en Core/Axum)
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

      // Logs básicos ICE/PC (útiles para depurar conectividad)
      pc.oniceconnectionstatechange = () => {
        console.log("ICE →", pc.iceConnectionState);
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          setStatus("closed");
        }
      };
      pc.onconnectionstatechange = () => {
        console.log("PC →", pc.connectionState);
      };
      pc.onicecandidateerror = (ev) => {
        console.warn("ICE error:", ev);
      };

      // 3) Agregar pista de audio saliente (mic)
      for (const track of local.getAudioTracks()) {
        pc.addTrack(track, local);
      }

      // 4) Preparar stream remoto y asignarlo al <audio>
      const remote = new MediaStream();
      remoteStreamRef.current = remote;
      pc.ontrack = (ev) => {
        for (const track of ev.streams[0].getTracks()) {
          remote.addTrack(track);
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remote;
          // Autoplay + play() para Safari/iOS si el usuario ya interactuó
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("open");
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed" ||
          pc.connectionState === "disconnected"
        ) {
          setStatus("closed");
        }
      };

      // 5) Offer local → esperar (un poco) ICE gathering → señalización
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

      setStatus("open");
    } catch (e) {
      setStatus("error");
      setErr(e instanceof Error ? e.message : String(e));
      try {
        pcRef.current?.close();
      } catch {}
      pcRef.current = null;
    }
  }

  function disconnect() {
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setStatus("closed");
  }

  useEffect(() => {
    return () => {
      try {
        pcRef.current?.close();
      } catch {}
      pcRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
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
        <audio ref={remoteAudioRef} controls autoPlay playsInline />
      </div>
    </div>
  );
}
