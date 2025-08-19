"use client";

/**
 * Lab 04 — WebRTC Audio (loopback)
 *
 * Objetivo
 * -------
 * 1) Capturar micrófono (mono) en el navegador.
 * 2) Enviar audio al backend vía WebRTC.
 * 3) El backend hace RTP-forwarding (eco) y retorna la pista remota.
 * 4) Reproducir la pista remota para validar media end-to-end.
 *
 * Notas de diseño
 * ---------------
 * - Componente autocontenido con controles mínimos (Conectar/Desconectar, Volumen, Salida).
 * - Comentado por etapas del flujo WebRTC y con limpieza defensiva de recursos.
 * - Estadísticas periódicas para verificar tráfico IN/OUT y métricas MVP.
 * - Panel adicional con detalles del ICE pair seleccionado (transporte y tipos).
 */

import { useEffect, useRef, useState } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

/* ================================================================
   1) Tipos, constantes y helpers de formato
   ================================================================ */

type Status = "idle" | "connecting" | "open" | "closed" | "error";

const ICE_GATHER_TIMEOUT_MS = 1200; // host/srflx típico
const STATS_INTERVAL_MS = 1000; // logging/refresh 1s
const ICE_INFO_INTERVAL_MS = 2000; // refresco de info ICE

const ICE_SERVERS: RTCConfiguration["iceServers"] = [
  { urls: ["stun:stun.l.google.com:19302"] },
  { urls: ["stun:stun.cloudflare.com:3478"] },
];

/** Métricas simples para el panel MVP. */
export type MvpStats = {
  rttMs: number | null;
  jitterMs: number | null;
  lossPct: number | null;
  inKbps: number | null;
  outKbps: number | null;
  playoutMs: number | null;
  iceState: string | null;
};

/** Algunos navegadores añaden estos campos (no estándar pero útiles). */
export type InboundAudioStats = RTCInboundRtpStreamStats & {
  jitterBufferDelay?: number;
  jitterBufferEmittedCount?: number;
  totalAudioEnergy?: number;
  totalSamplesDuration?: number;
};

/** Extensión suave para candidates con campos opcionales (sin any). */
type ExtendedIceCandidateStats = RTCStats & {
  id: string;
  type: "local-candidate" | "remote-candidate";
  ip?: string; // Chrome
  address?: string; // Safari
  port?: number;
  protocol?: string;
  candidateType?: string;
  networkType?: string; // Chrome
};

type IceCandidateKind = "host" | "srflx" | "prflx" | "relay" | "unknown";
type IceTransport = "udp" | "tcp" | "unknown";

export type IceInfo = {
  transport: IceTransport;
  local: {
    type: IceCandidateKind;
    address?: string;
    port?: number;
    networkType?: string;
  };
  remote: {
    type: IceCandidateKind;
    address?: string;
    port?: number;
    networkType?: string;
  };
  pathLabel: string; // ej: "udp / srflx→srflx"
};

function fmtMs(v: number | null) {
  return v == null ? "—" : `${Math.round(v)} ms`;
}
function fmtPct(v: number | null) {
  return v == null ? "—" : `${v.toFixed(1)}%`;
}
function fmtKbps(v: number | null) {
  return v == null ? "—" : `${Math.round(v)} kbps`;
}
function clsByThreshold(type: keyof MvpStats, v: number | null) {
  if (v == null) return "text-gray-500";
  switch (type) {
    case "rttMs":
      return v < 80
        ? "text-green-600"
        : v <= 150
        ? "text-yellow-600"
        : "text-red-600";
    case "jitterMs":
      return v < 20
        ? "text-green-600"
        : v <= 50
        ? "text-yellow-600"
        : "text-red-600";
    case "lossPct":
      return v < 1
        ? "text-green-600"
        : v <= 5
        ? "text-yellow-600"
        : "text-red-600";
    case "inKbps":
    case "outKbps":
      return v >= 12
        ? "text-green-600"
        : v >= 6
        ? "text-yellow-600"
        : "text-red-600";
    case "playoutMs":
      return v < 60
        ? "text-green-600"
        : v <= 120
        ? "text-yellow-600"
        : "text-red-600";
    default:
      return "";
  }
}

/* ================================================================
   2) Type guards de WebRTC Stats (sin any)
   ================================================================ */

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
/** Type guard: local candidate */
function isLocalCandidate(s: RTCStats): s is ExtendedIceCandidateStats {
  return s.type === "local-candidate";
}

/** Type guard: remote candidate */
function isRemoteCandidate(s: RTCStats): s is ExtendedIceCandidateStats {
  return s.type === "remote-candidate";
}

/* ================================================================
   3) Helpers WebRTC (ICE, formato)
   ================================================================ */

function toKind(t?: RTCIceCandidateType | string): IceCandidateKind {
  if (t === "host" || t === "srflx" || t === "prflx" || t === "relay") return t;
  return "unknown";
}
function toTransport(p?: string): IceTransport {
  if (p === "udp") return "udp";
  if (p === "tcp") return "tcp";
  return "unknown";
}
/** Extraer endpoint (normalizado ip/address/port/networkType) */
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
   4) Watchers de métricas
   ================================================================ */

/** Logs simples (consola) de tráfico IN/OUT. */
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

/** Logs por receiver (algunos navegadores reportan mejor así). */
function watchReceiverStats(pc: RTCPeerConnection) {
  const timer = setInterval(async () => {
    if (pc.connectionState === "closed") {
      clearInterval(timer);
      return;
    }
    for (const r of pc.getReceivers()) {
      if (r.track && r.track.kind === "audio") {
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

/** Watcher MVP: computa métricas clave (RTT/Jitter/Loss/Bitrates/Playout/ICE state). */
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

    // RTT (ms) desde el candidate-pair
    const rttMs =
      selectedPair && typeof selectedPair.currentRoundTripTime === "number"
        ? selectedPair.currentRoundTripTime * 1000
        : null;

    // Jitter (ms) desde inbound
    const jitterMs =
      inbound && typeof inbound.jitter === "number"
        ? inbound.jitter * 1000
        : null;

    // Pérdida de paquetes (%)
    let lossPct: number | null = null;
    if (inbound) {
      const lost = inbound.packetsLost ?? 0;
      const recv = inbound.packetsReceived ?? 0;
      const total = lost + recv;
      lossPct = total > 0 ? (lost / total) * 100 : 0;
    }

    // Bitrates (kbps) por delta de bytes / delta tiempo
    const now = performance.now();
    const deltaMs = now - lastTs;
    let inKbps: number | null = null;
    let outKbps: number | null = null;
    if (deltaMs > 0) {
      if (inbound && typeof inbound.bytesReceived === "number") {
        const d = inbound.bytesReceived - lastBytesIn;
        inKbps = Math.max(0, (d * 8) / deltaMs);
        lastBytesIn = inbound.bytesReceived;
      }
      if (outbound && typeof outbound.bytesSent === "number") {
        const d = outbound.bytesSent - lastBytesOut;
        outKbps = Math.max(0, (d * 8) / deltaMs);
        lastBytesOut = outbound.bytesSent;
      }
    }
    lastTs = now;

    // Playout delay efectivo (ms) si está disponible
    let playoutMs: number | null = null;
    if (inbound) {
      const ie = inbound as InboundAudioStats;
      const delay = ie.jitterBufferDelay;
      const count = ie.jitterBufferEmittedCount;
      if (typeof delay === "number" && typeof count === "number" && count > 0) {
        playoutMs = (delay / count) * 1000;
      }
    }

    const iceState = pc.iceConnectionState ?? null;

    onUpdate({
      rttMs,
      jitterMs,
      lossPct,
      inKbps,
      outKbps,
      playoutMs,
      iceState,
    });
  }, STATS_INTERVAL_MS);

  return () => clearInterval(timer);
}

/** Watcher de ICE Info: resuelve transporte + tipos + endpoints del par seleccionado. */
function startIceInfoWatcher(
  pc: RTCPeerConnection,
  onUpdate: (i: IceInfo | null) => void
) {
  const timer = setInterval(async () => {
    if (pc.connectionState === "closed") {
      clearInterval(timer);
      return;
    }
    const report = await pc.getStats();

    let selectedPairId: string | undefined;
    let selectedPair: RTCIceCandidatePairStats | null = null;
    const locals = new Map<string, RTCIceCandidateStats>();
    const remotes = new Map<string, RTCIceCandidateStats>();

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
    const localInfo = {
      type: toKind(lc?.candidateType),
      ...extractEndpoint(lc),
    };
    const remoteInfo = {
      type: toKind(rc?.candidateType),
      ...extractEndpoint(rc),
    };

    onUpdate({
      transport,
      local: localInfo,
      remote: remoteInfo,
      pathLabel: `${transport} / ${localInfo.type}→${remoteInfo.type}`,
    });
  }, ICE_INFO_INTERVAL_MS);

  return () => clearInterval(timer);
}

/* ================================================================
   5) Componente principal
   ================================================================ */

export default function Lab04WebRTCAudioPage() {
  const { user, session, loading } = useSessionGuard();

  // Estado general
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  // UI audio
  const [sinks, setSinks] = useState<MediaDeviceInfo[]>([]);
  const [volume, setVolume] = useState(1);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const stopStatsRef = useRef<(() => void) | null>(null);

  // Paneles de métricas
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

  /* ---------------------------
     Enumeración de salidas
     --------------------------- */
  async function updateAudioOutputs() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setSinks(devices.filter((d) => d.kind === "audiooutput"));
    } catch (e) {
      console.warn("enumerateDevices failed:", e);
    }
  }

  /* ---------------------------
     Conectar E2E
     --------------------------- */
  async function connect() {
    setErr(null);
    setNeedsUserGesture(false);
    setStatus("connecting");

    // Limpieza defensiva
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

      // 1) Capturar mic (audio mono con constraints razonables)
      const local = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: false,
      });
      localStreamRef.current = local;

      // Tras permisos, labels visibles
      await updateAudioOutputs();

      // 2) PeerConnection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Estados ICE/PC → status UI
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

      // 3) Forzar m-line de audio + enviar mic
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

        // Salida (sink) si está soportado
        if (hasSetSinkId(audioEl) && window.isSecureContext) {
          audioEl
            .setSinkId("default")
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

        console.log("ontrack:", {
          kind: ev.track.kind,
          id: ev.track.id,
          streamsLen: ev.streams?.length ?? 0,
          muted: ev.track.muted,
          enabled: ev.track.enabled,
          readyState: ev.track.readyState,
        });
      };

      // 5) Oferta + espera ICE + señalizar con backend
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

      // 6) Watchers: logs, métricas MVP y ICE info
      stopStatsRef.current = (() => {
        const a = startStatsWatcher(pc); // consola
        const b = watchReceiverStats(pc); // consola por RX
        const c = startMvpStatsWatcher(pc, setMvp); // panel MVP
        const d = startIceInfoWatcher(pc, setIce); // ICE Path

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
      if (stopStatsRef.current) stopStatsRef.current();
      pcRef.current = null;
    }
  }

  /* ---------------------------
     Desconectar + liberar recursos
     --------------------------- */
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
        el.srcObject = null;
      } catch {}
      try {
        el.removeAttribute("src");
        el.load();
      } catch {}
    }

    setIce(null);
  }

  function disconnect() {
    hardDisconnect();
    setStatus("closed");
  }

  /* ---------------------------
     Efectos de UI
     --------------------------- */
  // Volumen del <audio> sincronizado con el slider
  useEffect(() => {
    const el = remoteAudioRef.current;
    if (el) el.volume = volume;
  }, [volume]);

  // Limpieza on-unmount + refresh de dispositivos si cambian
  useEffect(() => {
    const onDeviceChange = () => updateAudioOutputs();
    navigator.mediaDevices?.addEventListener?.("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.(
        "devicechange",
        onDeviceChange
      );
      hardDisconnect();
    };
  }, []);

  /* ================================================================
     6) Render UI
     ================================================================ */

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Lab 04 — WebRTC Audio (Loopback)</h1>
      <p className="text-gray-600">
        Envía micrófono → backend → eco RTP → reproduce audio remoto.
      </p>

      {/* Controles rápidos */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={connect}
          className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          disabled={loading || status === "connecting" || status === "open"}
        >
          Conectar
        </button>
        <button
          onClick={disconnect}
          className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
          disabled={status !== "open" && status !== "connecting"}
        >
          Desconectar
        </button>

        <span className="ml-2" aria-live="polite">
          Estado: <b>{status}</b>
        </span>

        {/* Volumen */}
        <div className="flex items-center gap-2">
          <label htmlFor="volume-slider" className="text-sm">
            Volumen
          </label>
          <input
            id="volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.currentTarget.value))}
          />
          <button
            className="text-sm border px-2 py-1 rounded"
            onClick={() => {
              const el = remoteAudioRef.current;
              if (el) el.muted = !el.muted;
            }}
          >
            Mute/Unmute
          </button>
        </div>

        {/* Selector de salida */}
        {sinks.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="audio-sink-select" className="text-sm">
              Salida
            </label>
            <select
              id="audio-sink-select"
              className="border px-2 py-1 rounded"
              onChange={async (e) => {
                const el = remoteAudioRef.current;
                const id = e.currentTarget.value;
                if (el && hasSetSinkId(el) && window.isSecureContext) {
                  try {
                    await el.setSinkId(id);
                  } catch (err) {
                    console.warn("setSinkId failed:", err);
                  }
                }
              }}
            >
              <option value="default">Default</option>
              {sinks.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || d.deviceId}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Fallback si autoplay fue bloqueado */}
      {needsUserGesture && (
        <div>
          <button
            className="mt-2 px-3 py-2 rounded bg-blue-600 text-white"
            onClick={() => {
              const el = remoteAudioRef.current;
              if (el) {
                el.play()
                  .then(() => setNeedsUserGesture(false))
                  .catch((e) => console.warn("Play manual falló:", e));
              }
            }}
          >
            Reproducir audio
          </button>
          <p className="text-xs text-gray-500 mt-1">
            El navegador bloqueó la reproducción automática. Tocá “Reproducir
            audio”.
          </p>
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
          aria-label="Reproducción de eco remoto"
        />
      </div>

      {/* Panel de calidad (MVP) */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border">
          <div className="text-xs text-gray-500">Latencia RTT</div>
          <div
            className={`text-lg font-semibold ${clsByThreshold(
              "rttMs",
              mvp.rttMs
            )}`}
          >
            {fmtMs(mvp.rttMs)}
          </div>
        </div>
        <div className="p-3 rounded-xl border">
          <div className="text-xs text-gray-500">Jitter</div>
          <div
            className={`text-lg font-semibold ${clsByThreshold(
              "jitterMs",
              mvp.jitterMs
            )}`}
          >
            {fmtMs(mvp.jitterMs)}
          </div>
        </div>
        <div className="p-3 rounded-xl border">
          <div className="text-xs text-gray-500">Pérdida IN</div>
          <div
            className={`text-lg font-semibold ${clsByThreshold(
              "lossPct",
              mvp.lossPct
            )}`}
          >
            {fmtPct(mvp.lossPct)}
          </div>
        </div>
        <div className="p-3 rounded-xl border">
          <div className="text-xs text-gray-500">Bitrate IN</div>
          <div
            className={`text-lg font-semibold ${clsByThreshold(
              "inKbps",
              mvp.inKbps
            )}`}
          >
            {fmtKbps(mvp.inKbps)}
          </div>
        </div>
        <div className="p-3 rounded-xl border">
          <div className="text-xs text-gray-500">Bitrate OUT</div>
          <div
            className={`text-lg font-semibold ${clsByThreshold(
              "outKbps",
              mvp.outKbps
            )}`}
          >
            {fmtKbps(mvp.outKbps)}
          </div>
        </div>
        <div className="p-3 rounded-xl border">
          <div className="text-xs text-gray-500">Playout delay</div>
          <div
            className={`text-lg font-semibold ${clsByThreshold(
              "playoutMs",
              mvp.playoutMs
            )}`}
          >
            {fmtMs(mvp.playoutMs)}
          </div>
        </div>
      </div>

      {/* ICE Path (nuevo) */}
      <div className="text-xs text-gray-500 mt-2 space-y-1">
        <div>
          ICE: <b>{mvp.iceState ?? "—"}</b>
          {ice?.pathLabel && (
            <>
              {" · "}Ruta: <b>{ice.pathLabel}</b>
            </>
          )}
        </div>
        {ice && (
          <div className="text-[11px]">
            Local: {ice.local.type}
            {ice.local.address ? ` ${ice.local.address}` : ""}
            {typeof ice.local.port === "number" ? `:${ice.local.port}` : ""} ·
            Remote: {ice.remote.type}
            {ice.remote.address ? ` ${ice.remote.address}` : ""}
            {typeof ice.remote.port === "number"
              ? `:${ice.remote.port}`
              : ""}{" "}
            {ice.transport !== "unknown"
              ? `· ${ice.transport.toUpperCase()}`
              : ""}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   7) setSinkId guard (Chrome/Edge)
   ================================================================ */

function hasSetSinkId(
  el: HTMLMediaElement
): el is HTMLMediaElement & Required<Pick<HTMLMediaElement, "setSinkId">> {
  return (
    typeof (
      el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> }
    ).setSinkId === "function"
  );
}
