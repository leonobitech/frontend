"use client";

/**
 * Lab 04 — WebRTC Audio v1.1 (loopback, refactor a componentes)
 */

import { useEffect, useRef, useState } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

// UI components
import AudioControls from "@/components/labs/webrtc/AudioControls";
import { StatsPanel, type MvpStats } from "@/components/labs/webrtc/StatsPanel";
import {
  IcePathInfo,
  type IceInfo,
} from "@/components/labs/webrtc/IcePathInfo";
import { hasSetSinkId } from "@/components/labs/webrtc/utils";
import InputOutputSelector from "@/components/labs/webrtc/InputOutputSelector";

/* ================================================================
   1) Tipos, constantes y helpers
   ================================================================ */

type Status = "idle" | "connecting" | "open" | "closed" | "error";

const ICE_GATHER_TIMEOUT_MS = 1200;
const STATS_INTERVAL_MS = 1000;
const ICE_INFO_INTERVAL_MS = 2000;

const ICE_SERVERS: RTCConfiguration["iceServers"] = [
  { urls: ["stun:stun.l.google.com:19302"] },
  { urls: ["stun:stun.cloudflare.com:3478"] },
];

type InboundAudioStats = RTCInboundRtpStreamStats & {
  jitterBufferDelay?: number;
  jitterBufferEmittedCount?: number;
  totalAudioEnergy?: number;
  totalSamplesDuration?: number;
};

type ExtendedIceCandidateStats = RTCStats & {
  id: string;
  type: "local-candidate" | "remote-candidate";
  ip?: string;
  address?: string;
  port?: number;
  protocol?: string;
  candidateType?: string;
  networkType?: string;
};

function isOutboundAudio(r: RTCStats): r is RTCOutboundRtpStreamStats {
  const out = r as RTCOutboundRtpStreamStats & {
    mediaType?: string;
    kind?: string;
  };
  return (
    r.type === "outbound-rtp" &&
    (out.kind === "audio" || out.mediaType === "audio")
  );
}
function isInboundAudio(r: RTCStats): r is RTCInboundRtpStreamStats {
  const inn = r as RTCInboundRtpStreamStats & {
    mediaType?: string;
    kind?: string;
  };
  return (
    r.type === "inbound-rtp" &&
    (inn.kind === "audio" || inn.mediaType === "audio")
  );
}
function isTransportStats(s: RTCStats): s is RTCTransportStats {
  return s.type === "transport";
}
function isCandidatePairStats(s: RTCStats): s is RTCIceCandidatePairStats {
  return s.type === "candidate-pair";
}
function isLocalCandidate(s: RTCStats): s is ExtendedIceCandidateStats {
  return s.type === "local-candidate";
}
function isRemoteCandidate(s: RTCStats): s is ExtendedIceCandidateStats {
  return s.type === "remote-candidate";
}

function toTransport(p?: string): "udp" | "tcp" | "unknown" {
  if (p === "udp") return "udp";
  if (p === "tcp") return "tcp";
  return "unknown";
}
function toKind(t?: string): "host" | "srflx" | "prflx" | "relay" | "unknown" {
  if (t === "host" || t === "srflx" || t === "prflx" || t === "relay") return t;
  return "unknown";
}
function extractEndpoint(c?: ExtendedIceCandidateStats) {
  return {
    address: c?.ip ?? c?.address,
    port: c?.port,
    networkType: c?.networkType,
  };
}

/** Espera a que el ICE gathering termine o corta por timeout. */
async function waitIceGatheringComplete(
  pc: RTCPeerConnection,
  timeoutMs = ICE_GATHER_TIMEOUT_MS
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

/* ================================================================
   2) Watchers
   ================================================================ */

function startStatsWatcher(pc: RTCPeerConnection) {
  const timer = setInterval(async () => {
    if (pc.connectionState === "closed") {
      clearInterval(timer);
      return;
    }
    const stats = await pc.getStats();
    let outAudio: RTCOutboundRtpStreamStats | undefined;
    let inAudio: RTCInboundRtpStreamStats | undefined;
    stats.forEach((r: RTCStats) => {
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
  }, STATS_INTERVAL_MS);
  return () => clearInterval(timer);
}

function watchReceiverStats(pc: RTCPeerConnection) {
  const timer = setInterval(async () => {
    if (pc.connectionState === "closed") {
      clearInterval(timer);
      return;
    }
    for (const r of pc.getReceivers()) {
      if (r.track?.kind === "audio") {
        const rep = await r.getStats();
        rep.forEach((s: RTCStats) => {
          if (isInboundAudio(s)) {
            console.log("↓ inbound-audio (RX)", {
              packetsReceived: s.packetsReceived,
              bytesReceived: s.bytesReceived,
              jitter: s.jitter,
            });
          }
        });
      }
    }
  }, STATS_INTERVAL_MS);
  return () => clearInterval(timer);
}

function startMvpStatsWatcher(
  pc: RTCPeerConnection,
  onUpdate: (s: MvpStats) => void
) {
  let lastBytesIn = 0;
  let lastBytesOut = 0;
  let lastTs = performance.now();

  const timer = setInterval(async () => {
    if (pc.connectionState === "closed") {
      clearInterval(timer);
      return;
    }

    const report = await pc.getStats();
    let inbound: RTCInboundRtpStreamStats | undefined;
    let outbound: RTCOutboundRtpStreamStats | undefined;
    let selectedPairId: string | undefined;
    let selectedPair: RTCIceCandidatePairStats | null = null;

    report.forEach((s: RTCStats) => {
      if (isInboundAudio(s)) inbound = s;
      if (isOutboundAudio(s)) outbound = s;
      if (isTransportStats(s) && s.selectedCandidatePairId) {
        selectedPairId = s.selectedCandidatePairId;
      }
    });

    if (selectedPairId) {
      const maybe = report.get(selectedPairId);
      if (maybe && isCandidatePairStats(maybe)) selectedPair = maybe;
    }
    if (!selectedPair) {
      report.forEach((s: RTCStats) => {
        if (isCandidatePairStats(s) && s.state === "succeeded" && s.nominated) {
          selectedPair = s;
        }
      });
    }

    const rttMs =
      selectedPair?.currentRoundTripTime != null
        ? selectedPair.currentRoundTripTime * 1000
        : null;
    const jitterMs =
      inbound?.jitter != null ? (inbound.jitter as number) * 1000 : null;

    let lossPct: number | null = null;
    if (inbound) {
      const lost = inbound.packetsLost ?? 0;
      const recv = inbound.packetsReceived ?? 0;
      const total = lost + recv;
      lossPct = total > 0 ? (lost / total) * 100 : 0;
    }

    const now = performance.now();
    const deltaMs = now - lastTs;
    let inKbps: number | null = null;
    let outKbps: number | null = null;

    if (deltaMs > 0) {
      if (typeof inbound?.bytesReceived === "number") {
        const d = inbound.bytesReceived - lastBytesIn;
        inKbps = Math.max(0, (d * 8) / deltaMs);
        lastBytesIn = inbound.bytesReceived;
      }
      if (typeof outbound?.bytesSent === "number") {
        const d = outbound.bytesSent - lastBytesOut;
        outKbps = Math.max(0, (d * 8) / deltaMs);
        lastBytesOut = outbound.bytesSent;
      }
    }
    lastTs = now;

    let playoutMs: number | null = null;
    if (inbound) {
      const ie = inbound as InboundAudioStats;
      if (
        typeof ie.jitterBufferDelay === "number" &&
        typeof ie.jitterBufferEmittedCount === "number" &&
        ie.jitterBufferEmittedCount > 0
      ) {
        playoutMs = (ie.jitterBufferDelay / ie.jitterBufferEmittedCount) * 1000;
      }
    }

    onUpdate({
      rttMs,
      jitterMs,
      lossPct,
      inKbps,
      outKbps,
      playoutMs,
      iceState: pc.iceConnectionState ?? null,
    });
  }, STATS_INTERVAL_MS);

  return () => clearInterval(timer);
}

function startIceInfoWatcher(
  pc: RTCPeerConnection,
  onUpdate: (info: IceInfo | null) => void
) {
  const timer = setInterval(async () => {
    if (pc.connectionState === "closed") {
      clearInterval(timer);
      return;
    }
    const report = await pc.getStats();

    let selectedPairId: string | undefined;
    let selectedPair: RTCIceCandidatePairStats | null = null;
    const locals = new Map<string, ExtendedIceCandidateStats>();
    const remotes = new Map<string, ExtendedIceCandidateStats>();

    report.forEach((s: RTCStats) => {
      if (isTransportStats(s) && s.selectedCandidatePairId) {
        selectedPairId = s.selectedCandidatePairId;
      }
      if (isLocalCandidate(s)) locals.set(s.id, s);
      if (isRemoteCandidate(s)) remotes.set(s.id, s);
    });

    if (selectedPairId) {
      const maybe = report.get(selectedPairId);
      if (maybe && isCandidatePairStats(maybe)) selectedPair = maybe;
    }
    if (!selectedPair) {
      report.forEach((s: RTCStats) => {
        if (isCandidatePairStats(s) && s.state === "succeeded" && s.nominated) {
          selectedPair = s;
        }
      });
    }

    if (!selectedPair) {
      onUpdate(null);
      return;
    }

    const lc = locals.get(selectedPair.localCandidateId ?? "");
    const rc = remotes.get(selectedPair.remoteCandidateId ?? "");

    const transport = toTransport(lc?.protocol ?? rc?.protocol);
    const local = { type: toKind(lc?.candidateType), ...extractEndpoint(lc) };
    const remote = { type: toKind(rc?.candidateType), ...extractEndpoint(rc) };

    onUpdate({
      transport,
      local,
      remote,
      pathLabel: `${transport} / ${local.type}→${remote.type}`,
    });
  }, ICE_INFO_INTERVAL_MS);

  return () => clearInterval(timer);
}

/* ================================================================
   3) Componente principal
   ================================================================ */

export default function Lab04WebRTCAudioPage() {
  const { user, session, loading } = useSessionGuard();

  // Estado general
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  // UI audio
  const [volume, setVolume] = useState(1);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  // Dispositivos
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(
    "default"
  );

  // Refs WebRTC
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const stopStatsRef = useRef<(() => void) | null>(null);

  // Paneles
  const [mvp, setMvp] = useState<MvpStats>({
    rttMs: null,
    jitterMs: null,
    lossPct: null,
    inKbps: null,
    outKbps: null,
    playoutMs: null,
    iceState: null,
  });
  const [ice, setIce] = useState<IceInfo | null>(null);

  // Soporte para enrutar salida
  const supportsSetSinkId =
    typeof HTMLMediaElement !== "undefined" &&
    "setSinkId" in HTMLMediaElement.prototype &&
    window.isSecureContext;

  // Enumeración de dispositivos
  async function enumerateAudioDevices() {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setInputDevices(all.filter((d) => d.kind === "audioinput"));
      setOutputDevices(all.filter((d) => d.kind === "audiooutput"));
    } catch (e) {
      console.warn("enumerateDevices failed:", e);
    }
  }

  // Al montar: listar entradas/salidas y escuchar cambios del sistema
  useEffect(() => {
    enumerateAudioDevices();
    const onDeviceChange = () => enumerateAudioDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.(
        "devicechange",
        onDeviceChange
      );
    };
  }, []);

  // Limpieza al desmontar la página
  useEffect(() => {
    return () => {
      hardDisconnect();
    };
  }, []);

  // Conectar
  async function connect(): Promise<void> {
    if (pcRef.current && pcRef.current.connectionState !== "closed") {
      console.warn(
        "connect() ignorado: ya existe una RTCPeerConnection activa"
      );
      return;
    }

    setErr(null);
    setNeedsUserGesture(false);
    setStatus("connecting");

    // Limpieza previa
    try {
      pcRef.current?.close();
    } catch (e) {
      console.warn("Error cerrando RTCPeerConnection previa:", e);
    }
    if (stopStatsRef.current) {
      stopStatsRef.current();
      stopStatsRef.current = null;
    }
    pcRef.current = null;

    try {
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const meta = {
        ...buildClientMetaWithResolution(screenRes, { label: "leonobitech" }),
        path: "/lab/04-webrtc-audio",
        method: "POST",
      } as const;

      // 1) Capturar micrófono con el deviceId elegido (si hay)
      const local = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          ...(selectedInputId ? { deviceId: { exact: selectedInputId } } : {}),
        },
        video: false,
      });
      localStreamRef.current = local;

      // Tras permisos, refrescamos labels y listas:
      await enumerateAudioDevices();

      // 2) PeerConnection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          setStatus("closed");
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
      pc.onicecandidateerror = (ev) => console.warn("ICE error:", ev);

      // 3) Forzar m-line de audio y enviar mic
      pc.addTransceiver("audio", { direction: "sendrecv" });
      for (const track of local.getAudioTracks()) {
        pc.addTrack(track, local);
        track.enabled = true;
      }

      // 4) Pista remota → <audio>
      pc.ontrack = (ev) => {
        const audioEl = remoteAudioRef.current;
        if (!audioEl) return;

        const remoteStream = ev.streams?.[0] ?? new MediaStream([ev.track]);

        // Limpieza defensiva antes de adjuntar
        try {
          audioEl.srcObject = null;
        } catch {}
        audioEl.srcObject = remoteStream;

        // Encaminar salida si se soporta
        if (supportsSetSinkId && hasSetSinkId(audioEl)) {
          const sinkId = selectedOutputId || "default";
          audioEl
            .setSinkId(sinkId)
            .catch((e) => console.warn("setSinkId failed:", e));
        }

        audioEl.autoplay = true;
        audioEl.muted = false;
        audioEl.volume = volume;

        audioEl.play().catch((playErr) => {
          console.warn(
            "Autoplay bloqueado; requerirá gesto del usuario:",
            playErr
          );
          setNeedsUserGesture(true);
        });
      };

      // 5) Señalización
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      await waitIceGatheringComplete(pc, ICE_GATHER_TIMEOUT_MS);

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

      // 6) Watchers
      stopStatsRef.current = (() => {
        const a = startStatsWatcher(pc);
        const b = watchReceiverStats(pc);
        const c = startMvpStatsWatcher(pc, setMvp);
        const d = startIceInfoWatcher(pc, setIce);
        return () => {
          a();
          b();
          c();
          d();
        };
      })();

      setStatus("open");
    } catch (e: unknown) {
      setStatus("error");
      setErr(e instanceof Error ? e.message : String(e));

      try {
        pcRef.current?.close();
      } catch {}
      if (stopStatsRef.current) {
        stopStatsRef.current();
        stopStatsRef.current = null;
      }
      pcRef.current = null;

      // Liberar mic si se había tomado
      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        localStreamRef.current = null;
      }
    }
  }

  // Desconectar + limpiar
  function hardDisconnect() {
    const pc = pcRef.current;
    try {
      pc?.close();
    } catch {}
    pcRef.current = null;

    if (stopStatsRef.current) {
      stopStatsRef.current();
      stopStatsRef.current = null;
    }

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
        el.srcObject = null;
      } catch {}
      try {
        el.removeAttribute("src");
        el.load();
      } catch {}
    }

    setIce(null);
    setNeedsUserGesture(false);
    setMvp({
      rttMs: null,
      jitterMs: null,
      lossPct: null,
      inKbps: null,
      outKbps: null,
      playoutMs: null,
      iceState: null,
    });
  }

  function disconnect() {
    hardDisconnect();
    setStatus("closed");
  }

  // Volumen → <audio>
  useEffect(() => {
    const el = remoteAudioRef.current;
    if (el) el.volume = volume;
  }, [volume]);

  // Cambiar salida (si hay soporte)
  async function handleChangeOutput(id: string) {
    setSelectedOutputId(id);
    if (!supportsSetSinkId) return;
    const el = remoteAudioRef.current;
    if (el && hasSetSinkId(el)) {
      try {
        await el.setSinkId(id);
      } catch (err) {
        console.warn("setSinkId failed:", err);
      }
    }
  }

  const canConnect = inputDevices.length > 0;

  /* ================================================================
     Render
     ================================================================ */

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Lab 04 — WebRTC Audio (Loopback)</h1>
      <p className="text-gray-600">
        Envía micrófono → backend → eco RTP → reproduce audio remoto.
      </p>

      {/* Controles principales */}
      <AudioControls
        status={status}
        loading={loading}
        volume={volume}
        onVolumeChange={setVolume}
        remoteAudioRef={remoteAudioRef}
        onConnect={
          canConnect
            ? connect
            : () =>
                setErr("No hay dispositivo de entrada (micrófono) disponible.")
        }
        onDisconnect={disconnect}
      />

      {/* Selectores SIEMPRE visibles (responsive) */}
      {inputDevices.length === 0 && (
        <p className="text-sm text-amber-500">
          No se detecta micrófono. Conecta uno o concede permisos al navegador.
        </p>
      )}

      <InputOutputSelector
        inputs={inputDevices}
        outputs={supportsSetSinkId ? outputDevices : []}
        selectedInputId={selectedInputId}
        selectedOutputId={selectedOutputId}
        onChangeInput={(id) => setSelectedInputId(id || null)}
        onChangeOutput={handleChangeOutput}
      />

      {!supportsSetSinkId && (
        <p className="text-xs text-gray-500">
          Cambiar la salida no está soportado en este navegador.
        </p>
      )}

      {needsUserGesture && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-amber-400">El navegador bloqueó autoplay.</span>
          <button
            className="px-2 py-1 rounded bg-blue-600 text-white"
            onClick={async () => {
              const el = remoteAudioRef.current;
              if (!el) return;
              try {
                await el.play();
                setNeedsUserGesture(false);
              } catch (e) {
                console.warn(e);
              }
            }}
          >
            Reproducir
          </button>
        </div>
      )}

      {/* Errores */}
      {err && (
        <pre
          className="bg-red-950 text-red-100 p-3 rounded whitespace-pre-wrap"
          role="alert"
        >
          {err}
        </pre>
      )}

      {/* Reproductor remoto */}
      <div className="space-y-2">
        <div className="text-sm text-gray-500">
          Audio remoto (eco desde el servidor):
        </div>
        <audio
          ref={remoteAudioRef}
          controls
          autoPlay
          playsInline
          aria-label="Reproducción de eco remoto"
        />
      </div>

      {/* Panel de calidad */}
      <StatsPanel stats={mvp} />

      {/* RUTA ICE */}
      <IcePathInfo iceState={mvp.iceState} ice={ice} />
    </div>
  );
}
