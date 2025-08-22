"use client";

import { useRef, useState } from "react";

type ChatMsg =
  | { type: "ready"; lab: string; role: string }
  | { type: "pong" }
  | { type: "ack"; event: "barge_in" }
  | { type: "echo"; text: string }
  | { type: "stt_partial"; text: string }
  | { type: "agent_text"; text: string };

type SdpDesc = { type: "offer" | "answer"; sdp: string };

type UserLite = { id: string; role?: string; email?: string };
type SessionLite = {
  id: string;
  isRevoked?: boolean;
  expiresAt: string | Date;
};
type MetaLite = {
  deviceInfo?: { device?: string; os?: string; browser?: string };
  userAgent?: string;
  language?: string;
  platform?: string;
  timezone?: string;
  screenResolution?: string;
  label?: string;
  path?: string;
  method?: string;
  host?: string;
};

function parseChatMessage(raw: string): ChatMsg | null {
  try {
    const j = JSON.parse(raw);
    if (!j || typeof j.type !== "string") return null;
    switch (j.type) {
      case "ready":
        return typeof j.lab === "string" && typeof j.role === "string"
          ? j
          : null;
      case "pong":
        return { type: "pong" };
      case "ack":
        return j.event === "barge_in" ? j : null;
      case "echo":
      case "stt_partial":
      case "agent_text":
        return typeof j.text === "string" ? j : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Espera fin de ICE gathering (no-trickle)
function waitIceGatheringComplete(
  pc: RTCPeerConnection,
  timeoutMs = 1200
): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
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

export function useWebRTCChatDC(
  signalingPathOrGetPC: string | (() => RTCPeerConnection | null)
) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const sharedModeRef = useRef<boolean>(false);

  const [dcStatus, setDcStatus] = useState<
    "idle" | "connecting" | "open" | "closed" | "error"
  >("idle");
  const [sttPartial, setSttPartial] = useState<string>("");
  const [agentLines, setAgentLines] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [err, setErr] = useState<string>("");

  function log(evt: string) {
    const t = new Date().toLocaleTimeString();
    setEvents((prev) => [`${t} — ${evt}`, ...prev]);
  }

  function attachDcHandlers(dc: RTCDataChannel) {
    dc.onopen = () => {
      setDcStatus("open");
      log("DC 'chat' open");
      try {
        dc.send(JSON.stringify({ type: "ping" }));
      } catch {}
    };
    dc.onclose = () => {
      setDcStatus("closed");
      log("DC 'chat' closed");
    };
    dc.onmessage = (ev) => {
      const data = typeof ev.data === "string" ? ev.data : "";
      const msg = parseChatMessage(data);
      if (!msg) {
        log(`DC raw: ${data.slice(0, 200)}`);
        return;
      }
      switch (msg.type) {
        case "ready":
          log(`ready: lab=${msg.lab} role=${msg.role}`);
          break;
        case "pong":
          log("pong");
          break;
        case "ack":
          log(`ack: ${msg.event}`);
          break;
        case "echo":
          log(`echo: ${msg.text}`);
          break;
        case "stt_partial":
          setSttPartial(msg.text);
          break;
        case "agent_text":
          setAgentLines((prev) => [msg.text, ...prev]);
          break;
      }
    };
  }

  async function connectChat(args?: {
    user?: UserLite;
    session?: SessionLite;
    meta?: MetaLite;
  }) {
    if (dcRef.current && dcRef.current.readyState !== "closed") return;

    try {
      setErr("");
      setDcStatus("connecting");

      // === MODO PC COMPARTIDA ===
      if (typeof signalingPathOrGetPC === "function") {
        const shared = signalingPathOrGetPC();
        if (!shared) {
          setErr("PC compartida no disponible (conectá audio primero).");
          setDcStatus("error");
          return;
        }
        sharedModeRef.current = true;
        pcRef.current = shared;

        // sctp existe en la interfaz estándar; si aún es null, avisa que podría requerir renegociación
        const hasSctp =
          typeof shared.sctp !== "undefined" && shared.sctp !== null;
        if (!hasSctp)
          log(
            "Aviso: SCTP aún no inicializado; el DC puede requerir renegociación."
          );

        const dc = shared.createDataChannel("chat");
        dcRef.current = dc;
        attachDcHandlers(dc);

        // En compartido NO hay oferta/answer aquí
        if (dc.readyState !== "open") setDcStatus("connecting");
        return;
      }

      // === MODO PC INDEPENDIENTE (fallback conservado) ===
      const signalingPath = signalingPathOrGetPC as string;
      if (pcRef.current) return;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun.cloudflare.com:3478" },
        ],
      });
      pcRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        const st = pc.iceConnectionState;
        if (st === "failed" || st === "disconnected" || st === "closed") {
          setDcStatus("closed");
          log(`ICE: ${st}`);
        }
      };

      // Forzamos que la primera oferta incluya m=application/SCTP
      const bootstrap = pc.createDataChannel("__bootstrap_dc");
      bootstrap.onopen = () => {
        try {
          bootstrap.close();
        } catch {}
      };

      // Compatibilidad SDP (no capturamos mic acá)
      pc.addTransceiver("audio", { direction: "recvonly" });

      const dc = pc.createDataChannel("chat");
      dcRef.current = dc;
      attachDcHandlers(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitIceGatheringComplete(pc, 1200);

      const res = await fetch(signalingPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          offer: {
            type: "offer",
            sdp: pc.localDescription?.sdp ?? offer.sdp,
          } as SdpDesc,
          user: args?.user
            ? { id: args.user.id, role: args.user.role, email: args.user.email }
            : undefined,
          session: args?.session
            ? {
                id: args.session.id,
                isRevoked: args.session.isRevoked,
                expiresAt: args.session.expiresAt,
              }
            : undefined,
          meta: args?.meta,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`signaling failed: ${res.status} ${t}`);
      }

      const answer = (await res.json()) as {
        sdp: string;
        type: "answer" | string;
      };
      await pc.setRemoteDescription(answer as SdpDesc);
      log("Answer (chat) aplicada");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      setDcStatus("error");
      log(`connectChat error: ${msg}`);
    }
  }

  function disconnectChat() {
    const dc = dcRef.current;
    if (dc && dc.readyState !== "closed") {
      try {
        dc.close();
      } catch {}
    }
    dcRef.current = null;

    // En modo compartido NO cerramos la PC del audio
    if (!sharedModeRef.current) {
      const pc = pcRef.current;
      if (pc) {
        try {
          pc.getTransceivers().forEach((t) => t.stop());
          pc.close();
        } catch {}
      }
      pcRef.current = null;
    }

    setDcStatus("closed");
    setSttPartial("");
    setAgentLines([]);
    log("DC 'chat' disconnected");
  }

  function sendPing() {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify({ type: "ping" }));
  }
  function sendEcho(text: string) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(text);
  }
  function sendBargeIn() {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify({ type: "barge_in" }));
  }

  return {
    dcStatus,
    sttPartial,
    agentLines,
    events,
    err,
    connectChat, // args ahora es OPCIONAL
    disconnectChat,
    sendPing,
    sendEcho,
    sendBargeIn,
  };
}
