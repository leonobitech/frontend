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
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { ChatBubble } from "./ChatBubble";
import { DesktopControls } from "./DesktopControls";
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

/* ─── Exact same pattern as mobile TranscriptionListener ─── */
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

/* ─── Pure UI, no LiveKit hooks ─── */
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
      className="flex-1 overflow-y-auto scrollbar-none px-3 pt-4 pb-4 space-y-2.5"
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
export function VoiceChatDesktop() {
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasHistory, setHasHistory] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const roomNameRef = useRef<string | null>(null);
  const connectLock = useRef(false);

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
    if (connectLock.current) return;
    connectLock.current = true;
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar");
      connectLock.current = false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    roomRef.current = null;
    connectLock.current = false;
    setConnectionDetails(null);
    setHasHistory(true);
  }, []);

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

    cleanup();
    toast.success("Llamada finalizada");
  }, [cleanup]);

  const handleRoom = useCallback((room: Room) => {
    roomRef.current = room;
  }, []);

  // Auto-disconnect on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      roomRef.current?.disconnect(true);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Lock body scroll when chat is visible
  const chatVisible = !!connectionDetails || hasHistory;
  useEffect(() => {
    document.body.style.overflow = chatVisible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [chatVisible]);

  // Chat view
  if (chatVisible) {
    return (
      <section className="py-6">
        <div className="mx-auto max-w-4xl px-6">
          <div className="chat-wallpaper-desktop overflow-hidden rounded-xl border border-gray-200 shadow-xl dark:border-white/10 h-[calc(100vh-120px)] flex flex-col">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {connectionDetails ? (
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

            {/* Controls bar */}
            <div className="shrink-0 border-t border-white/5 bg-[#2B2B2B]">
              {connectionDetails ? (
                <DesktopControls onDisconnect={disconnect} />
              ) : hasHistory ? (
                <div className="flex justify-center py-3">
                  <button
                    onClick={() => { connectLock.current = false; connect(); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#3A3A3A] px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
                  >
                    <Mic className="h-4 w-4" />
                    Nueva conversación
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Idle
  return (
    <section className="min-h-screen flex items-center">
      <div className="mx-auto max-w-6xl px-6 w-full">
        <div className="flex flex-col items-center justify-center gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] md:text-4xl">
              Habla con nuestra IA
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-gray-500 dark:text-gray-400">
              Prueba nuestro asistente de voz en tiempo real. Usa tu micrófono
              para conversar y ve las transcripciones al instante.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={connect}
            disabled={isConnecting}
            className="inline-flex items-center gap-3 rounded-lg bg-[#3A3A3A] dark:bg-[#D1D5DB] px-8 py-4 text-base font-semibold text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Conectando...
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Iniciar conversación
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
