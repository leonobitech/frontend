"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import { Room, LogLevel, setLogLevel, RoomEvent } from "livekit-client";

setLogLevel(LogLevel.warn);
import { toast } from "sonner";
import { ChatBubble } from "./ChatBubble";
import { LongPressRing } from "./LongPressRing";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { useVoiceCall } from "./VoiceCallContext";
import "./chat-wallpaper.css";

const LIVEKIT_SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

interface ConnectionDetails {
  roomName: string;
  participantName: string;
  participantToken: string;
  disconnectSecret: string;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  isFinal: boolean;
  timestamp: number;
}

/* ─── RTVI Transcription Listener ─── */
function TranscriptionListener({
  onMessage,
  onRoom,
}: {
  onMessage: (msg: ChatMessage) => void;
  onRoom: (room: Room) => void;
}) {
  const room = useRoomContext();
  const counterRef = useRef(0);

  useEffect(() => {
    if (!room) return;
    onRoom(room);

    const handleData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);
        if (msg.label !== "rtvi-ai") return;

        if (msg.type === "user-transcription" && msg.data?.text?.trim()) {
          counterRef.current++;
          onMessage({
            id: `user-${counterRef.current}`,
            text: msg.data.text,
            isUser: true,
            isFinal: msg.data.final ?? true,
            timestamp: Date.now(),
          });
        } else if (msg.type === "bot-transcription" && msg.data?.text?.trim()) {
          counterRef.current++;
          onMessage({
            id: `bot-${counterRef.current}`,
            text: msg.data.text,
            isUser: false,
            isFinal: true,
            timestamp: Date.now(),
          });
        }
      } catch {
        // ignore non-RTVI data messages
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, onRoom, onMessage]);

  return <RoomAudioRenderer />;
}

/* ─── Chat messages view (independent of LiveKitRoom) ─── */

function ChatView({ messages }: { messages: ChatMessage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 pt-4 pb-[90px] space-y-2.5 scrollbar-none"
    >
      <div className="relative z-[1] flex flex-col min-h-full justify-end">
        <div className="space-y-2.5">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg.text}
              isUser={msg.isUser}
              isFinal={msg.isFinal}
              timestamp={msg.timestamp}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export function VoiceChatMobile() {
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasHistory, setHasHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const roomNameRef = useRef<string | null>(null);
  const disconnectSecretRef = useRef<string | null>(null);
  const { isInCall, setIsInCall, setIsConnecting, registerHangUp, registerConnect } = useVoiceCall();

  const handleMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const res = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const details: ConnectionDetails = await res.json();
      roomNameRef.current = details.roomName;
      disconnectSecretRef.current = details.disconnectSecret;
      setConnectionDetails(details);
      setIsInCall(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar");
    } finally {
      setIsConnecting(false);
    }
  }, [turnstileToken, setIsConnecting, setIsInCall]);

  const cleanup = useCallback(() => {
    setConnectionDetails(null);
    disconnectSecretRef.current = null;
    setIsInCall(false);
    setHasHistory(true);
    // Token is single-use, need a fresh one for reconnection
    setTurnstileToken(null);
    setIsVerified(false);
  }, [setIsInCall]);

  const disconnect = useCallback(async () => {
    try {
      await roomRef.current?.disconnect(true);
    } catch { /* ignore */ }

    // Force close room server-side
    const name = roomNameRef.current;
    const secret = disconnectSecretRef.current;
    if (name && secret) {
      fetch("/api/voice/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: name, disconnectSecret: secret }),
      }).catch(() => {});
      roomNameRef.current = null;
      disconnectSecretRef.current = null;
    }

    roomRef.current = null;
    cleanup();
    toast.success("Llamada finalizada", { position: "top-center", duration: 2000 });
  }, [cleanup]);

  const handleRoom = useCallback((room: Room) => {
    roomRef.current = room;
  }, []);

  // Lock body scroll when chat is visible
  useEffect(() => {
    if (isInCall || hasHistory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isInCall, hasHistory]);

  // Register connect/hangup for TabBar (only when verified)
  useEffect(() => {
    registerConnect(isVerified ? connect : null);
    registerHangUp(disconnect);
    return () => {
      registerConnect(null);
      registerHangUp(null);
    };
  }, [isVerified, connect, disconnect, registerConnect, registerHangUp]);

  // Show chat view if in call OR if there's history
  if (isInCall || hasHistory) {
    return (
      <div className="chat-wallpaper fixed top-[65px] left-0 right-0 bottom-0 flex flex-col z-10">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isInCall && connectionDetails ? (
            <LiveKitRoom
              serverUrl={LIVEKIT_SERVER_URL}
              token={connectionDetails.participantToken}
              connect={true}
              audio={true}
              video={false}
              onDisconnected={cleanup}
              onError={cleanup}
              className="flex-1 flex flex-col min-h-0"
            >
              <TranscriptionListener onMessage={handleMessage} onRoom={handleRoom} />
              <ChatView messages={messages} />
            </LiveKitRoom>
          ) : (
            <ChatView messages={messages} />
          )}
        </div>

        {error && (
          <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400">
              {error}
            </div>
          </div>
        )}

        {/* Re-validate Turnstile for reconnection (hidden until needed) */}
        {!isInCall && hasHistory && !isVerified && (
          <div className="absolute bottom-[100px] left-0 right-0 flex justify-center z-10">
            <TurnstileWidget
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || ""}
              onSuccess={(token) => { setTurnstileToken(token); setIsVerified(true); }}
            />
          </div>
        )}
      </div>
    );
  }

  // Idle: no history
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB]">
              Habla con nuestra IA
            </h2>
            <p className="mx-auto mt-3 max-w-md text-gray-500 dark:text-gray-400">
              Mantén presionado el botón <strong>Agente</strong> en la barra
              inferior durante 5 segundos para iniciar la conversación.
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-4">
            <TurnstileWidget
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || ""}
              onSuccess={(token) => { setTurnstileToken(token); setIsVerified(true); }}
            />
          </div>
        </div>
      </div>
      <LongPressRing />
    </section>
  );
}
