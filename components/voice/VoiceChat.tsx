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

function VoiceChatInner() {
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
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 pb-20 space-y-2.5"
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

  return (
    <div className="chat-wallpaper fixed inset-0 flex flex-col md:relative md:inset-auto md:mx-auto md:max-w-2xl md:h-[600px] md:rounded-xl md:border md:border-gray-200 md:shadow-xl md:dark:border-white/10">
      {isInCall && connectionDetails ? (
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
        >
          <VoiceChatInner />
        </LiveKitRoom>
      ) : (
        <div className="flex-1" />
      )}

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
