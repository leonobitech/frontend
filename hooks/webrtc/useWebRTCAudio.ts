// hooks/webrtc/useWebRTCAudio.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { MvpStats } from "@/components/labs/webrtc/StatsPanel";
import type { IceInfo } from "@/components/labs/webrtc/IcePathInfo";
import { hasSetSinkId } from "@/components/labs/webrtc/utils";

/* ====== helpers/types internos (copiados de la página, sin any) ====== */

type Status = "idle" | "connecting" | "open" | "closed" | "error";

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

const ICE_GATHER_TIMEOUT_MS = 1200;
const STATS_INTERVAL_MS = 1000;
const ICE_INFO_INTERVAL_MS = 2000;

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
      if (isTransportStats(s) && s.selectedCandidatePairId)
        selectedPairId = s.selectedCandidatePairId;
      if (isLocalCandidate(s)) locals.set(s.id, s);
      if (isRemoteCandidate(s)) remotes.set(s.id, s);
    });

    if (selectedPairId) {
      const maybe = report.get(selectedPairId);
      if (maybe && isCandidatePairStats(maybe)) selectedPair = maybe;
    }
    if (!selectedPair) {
      report.forEach((s: RTCStats) => {
        if (isCandidatePairStats(s) && s.state === "succeeded" && s.nominated)
          selectedPair = s;
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

/* ====================== HOOK PRINCIPAL ====================== */

export type UseWebRTCAudioOpts = {
  user: unknown;
  session: unknown;
  signalingPath: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  volume: number;
  selectedInputId: string | null;
  selectedOutputId: string | null;
  iceServers?: RTCConfiguration["iceServers"];
  meta?: Record<string, unknown>;
};

export function useWebRTCAudio({
  user,
  session,
  signalingPath,
  audioRef,
  volume,
  selectedInputId,
  selectedOutputId,
  iceServers,
  meta,
}: UseWebRTCAudioOpts) {
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

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

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const stopStatsRef = useRef<(() => void) | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // volumen → <audio>
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
  }, [audioRef, volume]);

  const hardDisconnect = useCallback(() => {
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

    const el = audioRef.current;
    if (el) {
      try {
        el.pause();
      } catch {}
      try {
        (el as HTMLMediaElement).srcObject = null;
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
  }, [audioRef]);

  const disconnect = useCallback(() => {
    hardDisconnect();
    setStatus("closed");
  }, [hardDisconnect]);

  const connect = useCallback(async () => {
    if (pcRef.current && pcRef.current.connectionState !== "closed") {
      console.warn(
        "connect() ignorado: ya existe una RTCPeerConnection activa"
      );
      return;
    }

    setErr(null);
    setNeedsUserGesture(false);
    setStatus("connecting");

    try {
      // cierra cualquier PC previa
      try {
        pcRef.current?.close();
      } catch {}
      if (stopStatsRef.current) {
        stopStatsRef.current();
        stopStatsRef.current = null;
      }
      pcRef.current = null;

      // 1) getUserMedia
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

      // 2) PeerConnection
      const pc = new RTCPeerConnection({
        iceServers: iceServers ?? [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun.cloudflare.com:3478"] },
        ],
      });
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
      pc.onicecandidateerror = (ev) =>
        console.warn("ICE error:", ev as unknown);

      // 3) m-line de audio + enviar mic
      pc.addTransceiver("audio", { direction: "sendrecv" });
      for (const track of local.getAudioTracks()) {
        pc.addTrack(track, local);
        track.enabled = true;
      }

      // 4) track remoto → <audio/>
      pc.ontrack = (ev) => {
        const audioEl = audioRef.current;
        if (!audioEl) return;

        const remoteStream = ev.streams?.[0] ?? new MediaStream([ev.track]);
        try {
          (audioEl as HTMLMediaElement).srcObject = null;
        } catch {}
        (audioEl as HTMLMediaElement).srcObject = remoteStream;

        if (
          "setSinkId" in HTMLMediaElement.prototype &&
          hasSetSinkId(audioEl) &&
          window.isSecureContext
        ) {
          const sinkId = selectedOutputId || "default";
          (
            audioEl as HTMLMediaElement & {
              setSinkId(id: string): Promise<void>;
            }
          )
            .setSinkId(sinkId)
            .catch((e: unknown) => console.warn("setSinkId failed:", e));
        }

        audioEl.autoplay = true;
        audioEl.muted = false;
        audioEl.volume = volume;

        audioEl.play().catch((playErr: unknown) => {
          console.warn(
            "Autoplay bloqueado; requerirá gesto del usuario:",
            playErr
          );
          setNeedsUserGesture(true);
        });
      };

      // 3.5) DC bootstrap para forzar SCTP/m=application en la 1ª oferta
      // (se cierra solo al abrir; no interfiere con tu DC "chat")
      const dcBootstrap = pc.createDataChannel("__bootstrap_dc");
      dcBootstrap.onopen = () => {
        try {
          dcBootstrap.close();
        } catch {}
      };

      // 5) Oferta + señalización
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      await waitIceGatheringComplete(pc, ICE_GATHER_TIMEOUT_MS);

      const resp = await fetch(signalingPath, {
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

      // 6) watchers
      const a = startMvpStatsWatcher(pc, setMvp);
      const b = startIceInfoWatcher(pc, setIce);
      // logs opcionales
      const logTimer = setInterval(async () => {
        const stats = await pc.getStats();
        let o: RTCOutboundRtpStreamStats | undefined;
        let i: RTCInboundRtpStreamStats | undefined;
        stats.forEach((r) => {
          if (isOutboundAudio(r)) o = r;
          if (isInboundAudio(r)) i = r;
        });
        if (o)
          console.log("↑ outbound-audio", {
            packetsSent: o.packetsSent,
            bytesSent: o.bytesSent,
          });
        if (i)
          console.log("↓ inbound-audio", {
            packetsReceived: i.packetsReceived,
            bytesReceived: i.bytesReceived,
          });
      }, STATS_INTERVAL_MS);

      stopStatsRef.current = () => {
        a();
        b();
        clearInterval(logTimer);
      };

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

      const ls = localStreamRef.current;
      if (ls) {
        try {
          ls.getTracks().forEach((t) => t.stop());
        } catch {}
        localStreamRef.current = null;
      }
    }
  }, [
    audioRef,
    iceServers,
    meta,
    selectedInputId,
    selectedOutputId,
    session,
    user,
    volume,
    signalingPath,
  ]);

  // cleanup al desmontar
  useEffect(() => {
    return () => {
      hardDisconnect();
    };
  }, [hardDisconnect]);

  return {
    // estado
    status,
    err,
    needsUserGesture,
    mvp,
    ice,
    // setters útiles para la UI
    setErr,
    setNeedsUserGesture,
    // acciones
    connect,
    disconnect,
    hardDisconnect,
    getPeerConnection: () => pcRef.current,
  };
}
