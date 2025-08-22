// hooks/webrtc/useWebRTCChatDC.ts
"use client";

import { useRef, useState } from "react";

type ChatMsg =
  | { type: "ready"; lab: string; role: string }
  | { type: "pong" }
  | { type: "ack"; event: "barge_in" }
  | { type: "echo"; text: string }
  | { type: "stt_partial"; text: string }
  | { type: "agent_text"; text: string };

// Para detectar SCTP sin usar "any"
type PeerWithSctp = RTCPeerConnection & { sctp?: RTCSctpTransport | null };

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

/**
 * PC compartida: pásame un getter que devuelva la RTCPeerConnection creada por useWebRTCAudio.
 * No hace señalización propia; solo cuelga un DataChannel "chat" sobre la misma PC.
 */
export function useWebRTCChatDC(getPC: () => RTCPeerConnection | null) {
  const dcRef = useRef<RTCDataChannel | null>(null);

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

  async function connectChat() {
    if (dcRef.current && dcRef.current.readyState !== "closed") {
      // ya hay DC colgado
      return;
    }
    const pc = getPC();
    if (!pc) {
      const msg = "PeerConnection no disponible. Conecta el audio primero.";
      setErr(msg);
      setDcStatus("error");
      log(msg);
      return;
    }

    try {
      setErr("");
      setDcStatus("connecting");

      // Aviso: si la oferta inicial NO incluyó m=application/SCTP,
      // este DC requeriría renegociación externa. Para evitarlo,
      // el hook de audio crea un DC bootstrap antes de la oferta.
      const hasSctp = Boolean((pc as PeerWithSctp).sctp);
      if (!hasSctp) {
        log(
          "Aviso: SCTP no inicializado; asegúrate de que el hook de audio agregó el DC bootstrap antes de la oferta."
        );
      }

      const dc = pc.createDataChannel("chat");
      dcRef.current = dc;

      dc.onopen = () => {
        setDcStatus("open");
        log("DC 'chat' open");
        dc.send(JSON.stringify({ type: "ping" }));
      };
      dc.onclose = () => {
        setDcStatus("closed");
        log("DC 'chat' closed");
      };
      dc.onerror = (e) => {
        setDcStatus("error");
        const msg = `DC error: ${String((e as Event).type || e)}`;
        setErr(msg);
        log(msg);
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

      // También reflejamos cambios de conexión de la PC
      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          setDcStatus("closed");
          log(`PC state: ${pc.connectionState}`);
        }
      };
      pc.oniceconnectionstatechange = () => {
        const st = pc.iceConnectionState;
        if (st === "failed" || st === "disconnected" || st === "closed") {
          setDcStatus("closed");
          log(`ICE: ${st}`);
        }
      };
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
    setDcStatus("closed");
    // (opcional) limpiar buffers de UI
    setSttPartial("");
    setAgentLines([]);
    log("DC 'chat' disconnected (client)");
  }

  function sendPing() {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify({ type: "ping" }));
  }
  function sendEcho(text: string) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    // el server lo ecoa como {"type":"echo","text":...}
    dc.send(text);
  }
  function sendBargeIn() {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(JSON.stringify({ type: "barge_in" }));
  }

  return {
    // estado DC
    dcStatus,
    sttPartial,
    agentLines,
    events,
    err,
    // acciones DC
    connectChat,
    disconnectChat,
    sendPing,
    sendEcho,
    sendBargeIn,
  };
}
