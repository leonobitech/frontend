"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useTranscriptions,
} from "@livekit/components-react";
import type { TextStreamData } from "@livekit/components-react";
import { ChatBubble } from "./ChatBubble";
import { VoiceControls } from "./VoiceControls";

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

// Track seen stream IDs to determine finality (once a new stream replaces, old is final)
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
      // Mark previous messages from same participant as final
      const identity = t.participantInfo?.identity;
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

function VoiceChatInner({ onDisconnect }: { onDisconnect: () => void }) {
  useVoiceAssistant();
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
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-20 pb-4 space-y-3 md:pt-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Esperando al agente...
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.text}
            isUser={msg.isUser}
            isFinal={msg.isFinal}
          />
        ))}
      </div>

      <RoomAudioRenderer />
      <VoiceControls onDisconnect={onDisconnect} />
    </div>
  );
}

/* ─── Main VoiceChat component ─── */

export function VoiceChat() {
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnectionDetails(null);
  }, []);

  // Idle state
  if (!connectionDetails) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] md:text-4xl">
            Habla con nuestra IA
          </h2>
          <p className="mx-auto mt-3 max-w-md text-gray-500 dark:text-gray-400">
            Prueba nuestro asistente de voz en tiempo real. Usa tu micrófono
            para conversar y ve las transcripciones al instante.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={connect}
          disabled={isConnecting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#3A3A3A] dark:bg-[#D1D5DB] px-7 py-3.5 text-base font-semibold text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Conectando...
            </>
          ) : (
            "Iniciar conversación"
          )}
        </button>
      </div>
    );
  }

  // Connected state
  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden fixed inset-0 z-30 bg-white dark:bg-[#2B2B2B] md:relative md:inset-auto md:z-auto md:h-[600px] md:rounded-lg md:border md:border-gray-200 md:shadow-lg md:dark:border-white/10 md:dark:bg-[#333333]">
      <LiveKitRoom
        serverUrl={connectionDetails.serverUrl}
        token={connectionDetails.participantToken}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={() => setConnectionDetails(null)}
        onError={(err) => {
          console.error("LiveKit error:", err);
          setError("Connection lost");
          setConnectionDetails(null);
        }}
      >
        <VoiceChatInner onDisconnect={disconnect} />
      </LiveKitRoom>
    </div>
  );
}
