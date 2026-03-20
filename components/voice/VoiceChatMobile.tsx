"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useTranscriptions,
  useRoomContext,
} from "@livekit/components-react";
import type { TextStreamData } from "@livekit/components-react";
import { Room } from "livekit-client";
import { toast } from "sonner";
import { ChatBubble } from "./ChatBubble";
import { LongPressRing } from "./LongPressRing";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { useVoiceCall } from "./VoiceCallContext";
import "./chat-wallpaper.css";

interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  isFinal: boolean;
  timestamp: number;
}

function processTranscriptions(
  transcriptions: TextStreamData[],
  prevMessages: ChatMessage[]
): ChatMessage[] {
  const updated = [...prevMessages];

  for (const t of transcriptions) {
    const isUser = t.participantInfo?.identity?.startsWith("user-") ?? false;
    const id = t.streamInfo?.id ?? `${t.participantInfo?.identity}-${Date.now()}`;
    const text = t.text ?? "";

    if (!text.trim()) continue;

    const existingIdx = updated.findIndex((m) => m.id === id);
    if (existingIdx >= 0) {
      updated[existingIdx] = { ...updated[existingIdx], text, isFinal: true };
    } else {
      for (let i = updated.length - 1; i >= 0; i--) {
        if (!updated[i].isFinal && updated[i].isUser === isUser) {
          updated[i] = { ...updated[i], isFinal: true };
        }
      }

      updated.push({
        id,
        text,
        isUser,
        isFinal: true,
        timestamp: t.streamInfo?.timestamp ?? Date.now(),
      });
    }
  }

  return updated;
}

/* ─── Transcription listener (inside LiveKitRoom) ─── */

function TranscriptionListener({
  onMessages,
  onRoom,
}: {
  onMessages: (msgs: ChatMessage[]) => void;
  onRoom: (room: Room) => void;
}) {
  useVoiceAssistant();
  const room = useRoomContext();
  const transcriptions = useTranscriptions();

  useEffect(() => {
    if (room) onRoom(room);
  }, [room, onRoom]);

  useEffect(() => {
    if (!transcriptions.length) return;
    onMessages(processTranscriptions(transcriptions, []));
  }, [transcriptions, onMessages]);

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
  const roomRef = useRef<Room | null>(null);
  const roomNameRef = useRef<string | null>(null);
  const { isInCall, setIsInCall, setIsConnecting, registerHangUp, registerConnect } = useVoiceCall();

  const handleMessages = useCallback((newMsgs: ChatMessage[]) => {
    setMessages((prev) => {
      const merged = [...prev];
      for (const msg of newMsgs) {
        const idx = merged.findIndex((m) => m.id === msg.id);
        if (idx >= 0) {
          merged[idx] = msg;
        } else {
          merged.push(msg);
        }
      }
      return merged;
    });
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const res = await fetch("/api/voice/token", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const details: ConnectionDetails = await res.json();
      roomNameRef.current = details.roomName;
      setConnectionDetails(details);
      setIsInCall(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar");
    } finally {
      setIsConnecting(false);
    }
  }, [setIsConnecting, setIsInCall]);

  const cleanup = useCallback(() => {
    setConnectionDetails(null);
    setIsInCall(false);
    setHasHistory(true);
  }, [setIsInCall]);

  const disconnect = useCallback(async () => {
    try {
      await roomRef.current?.disconnect(true);
    } catch { /* ignore */ }

    // Force close room server-side
    const name = roomNameRef.current;
    if (name) {
      fetch("/api/voice/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: name }),
      }).catch(() => {});
      roomNameRef.current = null;
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
              serverUrl={connectionDetails.serverUrl}
              token={connectionDetails.participantToken}
              connect={true}
              audio={true}
              video={false}
              onDisconnected={cleanup}
              onError={cleanup}
              className="flex-1 flex flex-col min-h-0"
            >
              <TranscriptionListener onMessages={handleMessages} onRoom={handleRoom} />
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
              onSuccess={() => setIsVerified(true)}
            />
          </div>
        </div>
      </div>
      <LongPressRing />
    </section>
  );
}
