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
import { ChatBubble } from "./ChatBubble";
import { ChatHeader } from "./ChatHeader";
import { DesktopControls } from "./DesktopControls";
import { LongPressRing } from "./LongPressRing";
import { useVoiceCall } from "./VoiceCallContext";
import { useIsMobile } from "@/hooks/useIsMobile";
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

/* ─── Chat inner (shared between mobile and desktop) ─── */

function VoiceChatInner({
  roomRef,
  onDisconnect,
  showControls = false,
}: {
  roomRef: React.MutableRefObject<Room | null>;
  onDisconnect?: () => void;
  showControls?: boolean;
}) {
  useVoiceAssistant();
  const room = useRoomContext();

  useEffect(() => {
    roomRef.current = room;
  }, [room, roomRef]);

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
    <>
      {showControls && <ChatHeader />}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 pt-4 pb-24 space-y-2.5 md:pb-4"
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

      <RoomAudioRenderer />

      {showControls && onDisconnect && <DesktopControls onDisconnect={onDisconnect} />}
    </>
  );
}

/* ─── Main VoiceChat component ─── */

export function VoiceChat() {
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const connectLock = useRef(false);
  const isMobile = useIsMobile();
  const { isInCall, isConnecting, setIsInCall, setIsConnecting, registerHangUp, registerConnect } = useVoiceCall();

  // Stable refs for callbacks (avoid stale closures)
  const connectFn = useRef<() => Promise<void>>(async () => {});
  const disconnectFn = useRef<() => Promise<void>>(async () => {});

  connectFn.current = async () => {
    if (connectLock.current || isInCall) return;
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
      setConnectionDetails(details);
      setIsInCall(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar");
      connectLock.current = false;
    } finally {
      setIsConnecting(false);
    }
  };

  disconnectFn.current = async () => {
    try {
      await roomRef.current?.disconnect(true);
    } catch {
      // ignore
    }
    roomRef.current = null;
    connectLock.current = false;
    setConnectionDetails(null);
    setIsInCall(false);
  };

  const connect = useCallback(() => connectFn.current?.(), []);
  const disconnect = useCallback(() => disconnectFn.current?.(), []);

  // Register for TabBar — stable refs, no dependency issues
  useEffect(() => {
    registerConnect(connect);
    registerHangUp(disconnect);
    return () => {
      registerConnect(null);
      registerHangUp(null);
    };
  }, [connect, disconnect, registerConnect, registerHangUp]);

  // Auto-disconnect on tab close
  useEffect(() => {
    const handleBeforeUnload = () => disconnect();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [disconnect]);

  /* ─── In-call ─── */
  if (isInCall && connectionDetails) {
    if (isMobile) {
      return (
        <div className="chat-wallpaper fixed top-[65px] left-0 right-0 bottom-0 flex flex-col z-10">
          <LiveKitRoom
            serverUrl={connectionDetails.serverUrl}
            token={connectionDetails.participantToken}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={disconnect}
            onError={() => disconnect()}
            className="flex-1 flex flex-col min-h-0"
          >
            <VoiceChatInner roomRef={roomRef} />
          </LiveKitRoom>
        </div>
      );
    }

    return (
      <section className="py-10 md:py-16">
        <div className="mx-auto max-w-2xl px-6">
          <div className="chat-wallpaper overflow-hidden rounded-xl border border-gray-200 shadow-xl dark:border-white/10 h-[600px] flex flex-col">
            <LiveKitRoom
              serverUrl={connectionDetails.serverUrl}
              token={connectionDetails.participantToken}
              connect={true}
              audio={true}
              video={false}
              onDisconnected={disconnect}
              onError={() => disconnect()}
              className="flex-1 flex flex-col min-h-0"
            >
              <VoiceChatInner
                roomRef={roomRef}
                onDisconnect={disconnect}
                showControls={true}
              />
            </LiveKitRoom>
          </div>
        </div>
      </section>
    );
  }

  /* ─── Idle ─── */
  if (isMobile) {
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
          </div>
        </div>
        <LongPressRing />
      </section>
    );
  }

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
