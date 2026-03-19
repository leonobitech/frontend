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
import { ChatBubble } from "./ChatBubble";
import { LongPressRing } from "./LongPressRing";
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

/* ─── Inner component (must be inside LiveKitRoom) ─── */

function VoiceChatInner({ onRoomReady }: { onRoomReady?: (room: Room) => void }) {
  useVoiceAssistant();
  const room = useRoomContext();

  useEffect(() => {
    if (room) onRoomReady?.(room);
  }, [room, onRoomReady]);
  const transcriptions = useTranscriptions();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transcriptions.length) return;
    setMessages((prev) => processTranscriptions(transcriptions, prev));
  }, [transcriptions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 pt-16 pb-24 space-y-2.5 md:pt-4 md:pb-4"
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
      <RoomAudioRenderer />
    </div>
  );
}

/* ─── Main VoiceChat component ─── */

export function VoiceChat() {
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const { isInCall, setIsInCall, setIsConnecting, registerHangUp, registerConnect } = useVoiceCall();

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
      setConnectionDetails(details);
      setIsInCall(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar");
    } finally {
      setIsConnecting(false);
    }
  }, [setIsConnecting, setIsInCall]);

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect(true);
    roomRef.current = null;
    setConnectionDetails(null);
    setIsInCall(false);
  }, [setIsInCall]);

  // Register connect/hangup callbacks for TabBar
  useEffect(() => {
    registerConnect(connect);
    registerHangUp(disconnect);
    return () => {
      registerConnect(null);
      registerHangUp(null);
    };
  }, [connect, disconnect, registerConnect, registerHangUp]);

  // Auto-disconnect on page close/navigate away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isInCall) disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (isInCall) disconnect();
    };
  }, [isInCall, disconnect]);

  // In-call: show chat wallpaper with bubbles
  if (isInCall && connectionDetails) {
    return (
      <div className="chat-wallpaper fixed inset-0 flex flex-col z-10 md:relative md:inset-auto md:z-auto md:mx-auto md:max-w-2xl md:h-[600px] md:rounded-xl md:border md:border-gray-200 md:shadow-xl md:dark:border-white/10">
        <div className="flex-1 flex flex-col min-h-0">
          <LiveKitRoom
            serverUrl={connectionDetails.serverUrl}
            token={connectionDetails.participantToken}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={disconnect}
            onError={(err) => {
              console.error("LiveKit error:", err);
              setError("Connection lost");
              disconnect();
            }}
            className="flex-1 flex flex-col min-h-0"
          >
            <VoiceChatInner onRoomReady={(r) => { roomRef.current = r; }} />
          </LiveKitRoom>
        </div>

        {error && (
          <div className="absolute top-20 left-0 right-0 flex justify-center z-10">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400">
              {error}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Idle: landing page with promo + long press ring overlay
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-center gap-6 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] md:text-4xl">
              Habla con nuestra IA
            </h2>
            <p className="mx-auto mt-3 max-w-md text-gray-500 dark:text-gray-400">
              Prueba nuestro asistente de voz en tiempo real. Mantén presionado
              el botón <strong>Agente</strong> en la barra inferior durante 5 segundos
              para iniciar la conversación.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>

      {/* Long press ring overlay — shows on any page while pressing */}
      <LongPressRing />
    </section>
  );
}
