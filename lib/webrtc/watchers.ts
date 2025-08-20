// lib/webrtc/watchers.ts
import type { MvpStats } from "@/components/labs/webrtc/StatsPanel";
import type { IceInfo } from "@/components/labs/webrtc/IcePathInfo";

/* ===== Tipos de apoyo (sin any) ===== */

type InboundAudioStats = RTCInboundRtpStreamStats & {
  jitterBufferDelay?: number;
  jitterBufferEmittedCount?: number;
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

/* ===== Constantes ===== */

const STATS_INTERVAL_MS = 1000;
const ICE_INFO_INTERVAL_MS = 2000;

/* ===== Type guards ===== */

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

/* ===== Helpers ===== */

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

/* ===== Watchers exportados ===== */

export function startStatsWatcher(pc: RTCPeerConnection) {
  const timer = setInterval(async () => {
    if (pc.connectionState === "closed") {
      clearInterval(timer);
      return;
    }
    const stats = await pc.getStats();
    let outAudio: RTCOutboundRtpStreamStats | undefined;
    let inAudio: RTCInboundRtpStreamStats | undefined;
    stats.forEach((r) => {
      if (isOutboundAudio(r)) outAudio = r as RTCOutboundRtpStreamStats;
      if (isInboundAudio(r)) inAudio = r as RTCInboundRtpStreamStats;
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

export function watchReceiverStats(pc: RTCPeerConnection) {
  const timer = setInterval(async () => {
    if (pc.connectionState === "closed") {
      clearInterval(timer);
      return;
    }
    for (const r of pc.getReceivers()) {
      if (r.track?.kind !== "audio") continue;
      const rep = await r.getStats();
      rep.forEach((s) => {
        if (isInboundAudio(s)) {
          const inn = s as RTCInboundRtpStreamStats;
          console.log("↓ inbound-audio (RX)", {
            packetsReceived: inn.packetsReceived,
            bytesReceived: inn.bytesReceived,
            jitter: inn.jitter,
          });
        }
      });
    }
  }, STATS_INTERVAL_MS);
  return () => clearInterval(timer);
}

export function startMvpStatsWatcher(
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

    report.forEach((s) => {
      if (isInboundAudio(s)) inbound = s as RTCInboundRtpStreamStats;
      if (isOutboundAudio(s)) outbound = s as RTCOutboundRtpStreamStats;
      if (
        isTransportStats(s) &&
        (s as RTCTransportStats).selectedCandidatePairId
      ) {
        selectedPairId = (s as RTCTransportStats).selectedCandidatePairId;
      }
    });

    if (selectedPairId) {
      const maybe = report.get(selectedPairId);
      if (maybe && isCandidatePairStats(maybe))
        selectedPair = maybe as RTCIceCandidatePairStats;
    }
    if (!selectedPair) {
      report.forEach((s) => {
        if (isCandidatePairStats(s)) {
          const p = s as RTCIceCandidatePairStats;
          if (p.state === "succeeded" && p.nominated) selectedPair = p;
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

export function startIceInfoWatcher(
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

    report.forEach((s) => {
      if (
        isTransportStats(s) &&
        (s as RTCTransportStats).selectedCandidatePairId
      ) {
        selectedPairId = (s as RTCTransportStats).selectedCandidatePairId;
      }
      if (isLocalCandidate(s))
        locals.set(
          (s as ExtendedIceCandidateStats).id,
          s as ExtendedIceCandidateStats
        );
      if (isRemoteCandidate(s))
        remotes.set(
          (s as ExtendedIceCandidateStats).id,
          s as ExtendedIceCandidateStats
        );
    });

    if (selectedPairId) {
      const maybe = report.get(selectedPairId);
      if (maybe && isCandidatePairStats(maybe))
        selectedPair = maybe as RTCIceCandidatePairStats;
    }
    if (!selectedPair) {
      report.forEach((s) => {
        if (isCandidatePairStats(s)) {
          const p = s as RTCIceCandidatePairStats;
          if (p.state === "succeeded" && p.nominated) selectedPair = p;
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
