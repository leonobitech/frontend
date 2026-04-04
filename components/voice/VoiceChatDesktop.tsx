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
import { Room, RoomEvent, LogLevel, setLogLevel } from "livekit-client";

setLogLevel(LogLevel.warn);
import { Mic } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { ChatBubble } from "./ChatBubble";
import { DesktopControls } from "./DesktopControls";
import { RestaurantCards, type Restaurant } from "./RestaurantCards";

const TalkingHeadAvatar = dynamic(
  () => import("./TalkingHeadAvatar").then((m) => m.TalkingHeadAvatar),
  { ssr: false }
);
const AudioVisualizer = dynamic(
  () => import("./AudioVisualizer").then((m) => m.AudioVisualizer),
  { ssr: false }
);
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
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

function processTranscriptions(
  transcriptions: TextStreamData[],
  prevMessages: ChatMessage[],
): ChatMessage[] {
  const updated = [...prevMessages];

  for (const t of transcriptions) {
    const isUser = t.participantInfo?.identity?.startsWith("user-") ?? false;
    const id =
      t.streamInfo?.id ?? `${t.participantInfo?.identity}-${Date.now()}`;
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

/* ─── TranscriptionListener ─── */
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
function ChatView({ messages, restaurants, onCloseCards }: { messages: ChatMessage[]; restaurants?: Restaurant[]; onCloseCards?: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, restaurants]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto scrollbar-none px-3 pt-4 pb-4 space-y-2.5"
    >
      <div className="relative z-1 flex flex-col min-h-full justify-end">
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
          {/* Inline restaurant cards from data track */}
          {restaurants && restaurants.length > 0 && onCloseCards && (
            <RestaurantCards restaurants={restaurants} onClose={onCloseCards} />
          )}
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
  const [isVerified, setIsVerified] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const roomRef = useRef<Room | null>(null);
  const roomNameRef = useRef<string | null>(null);
  const disconnectSecretRef = useRef<string | null>(null);
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
      return merged.sort((a, b) => a.timestamp - b.timestamp);
    });
  }, []);

  const connect = useCallback(async () => {
    if (connectLock.current) return;
    connectLock.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      // Request mic permission before LiveKit connects (prevents NotAllowedError)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar");
      connectLock.current = false;
    } finally {
      setIsConnecting(false);
    }
  }, [turnstileToken]);

  const cleanup = useCallback(() => {
    roomRef.current = null;
    disconnectSecretRef.current = null;
    connectLock.current = false;
    setConnectionDetails(null);
    setHasHistory(true);
    // Token is single-use, need a fresh one for reconnection
    setTurnstileToken(null);
    setIsVerified(false);
    setRestaurants([]);
  }, []);

  const disconnect = useCallback(async () => {
    // Disconnect sound
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
      setTimeout(() => ctx.close(), 800);
    } catch {}

    setIsDisconnecting(true);
    await new Promise((r) => setTimeout(r, 800));

    try {
      await roomRef.current?.disconnect(true);
    } catch {}

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

    setIsDisconnecting(false);
    setCallSeconds(0);
    cleanup();
    toast.success("Llamada finalizada");
  }, [cleanup]);

  const handleRoom = useCallback((room: Room) => {
    roomRef.current = room;

    // Listen for data tracks from agent (restaurant cards, etc.)
    const handleData = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
      if (topic !== "leonobit.ui") return;
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "restaurant_cards") {
          setRestaurants(data.data);
        }
      } catch (e) {
        console.error("Failed to parse data track:", e);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
  }, []);

  // Call timer
  useEffect(() => {
    if (!connectionDetails) return;
    const interval = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [connectionDetails]);

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
    return () => {
      document.body.style.overflow = "";
    };
  }, [chatVisible]);

  // Chat view
  if (chatVisible) {
    return (
      <section className="py-6">
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-[calc(100vh-120px)] flex gap-4">
            {/* Left: Avatar panel */}
            {connectionDetails && (
              <LiveKitRoom
                serverUrl={LIVEKIT_SERVER_URL}
                token={connectionDetails.participantToken}
                connect={true}
                audio={true}
                video={false}
                onDisconnected={cleanup}
                onError={cleanup}
                className="w-[340px] shrink-0 flex flex-col"
              >
                <TranscriptionListener
                  onMessages={handleMessages}
                  onRoom={handleRoom}
                />
                <div className={`flex-1 rounded-xl overflow-hidden border border-white/30 flex flex-col ${isDisconnecting ? "avatar-disconnect" : "avatar-glow-pulse"}`}
                  style={{ boxShadow: "0 0 8px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.25), 0 0 50px rgba(255,255,255,0.1)" }}>
                  {/* Avatar */}
                  <div className="flex-1 min-h-[300px]">
                    <TalkingHeadAvatar cameraView="upper" />
                  </div>
                  {/* Timer */}
                  <div className="text-center py-2 bg-black/30">
                    <span className="text-xs font-mono text-white/50 tabular-nums">
                      {String(Math.floor(callSeconds / 60)).padStart(2, "0")}:{String(callSeconds % 60).padStart(2, "0")}
                    </span>
                  </div>
                  {/* Audio visualizer */}
                  <div className="bg-black/30 px-2 pb-2">
                    <AudioVisualizer barCount={48} />
                  </div>
                </div>
                {/* Disconnect button below avatar */}
                <div className="mt-3">
                  <DesktopControls onDisconnect={disconnect} />
                </div>
              </LiveKitRoom>
            )}

            {/* Right: Chat panel */}
            <div className="flex-1 max-w-[720px] mx-auto chat-wallpaper-desktop overflow-hidden rounded-xl border border-gray-200 shadow-xl dark:border-white/10 flex flex-col">
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <ChatView
                  messages={messages}
                  restaurants={restaurants}
                  onCloseCards={() => setRestaurants([])}
                />
              </div>

              {/* Controls bar (reconnect when no active call) */}
              {!connectionDetails && hasHistory && (
                <div className="shrink-0 border-t border-white/5 bg-[#2B2B2B]">
                  <div className="flex flex-col items-center gap-3 py-3">
                    {!isVerified ? (
                      <TurnstileWidget
                        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || ""}
                        onSuccess={(token) => { setTurnstileToken(token); setIsVerified(true); }}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          connectLock.current = false;
                          connect();
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#3A3A3A] px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
                      >
                        <Mic className="h-4 w-4" />
                        Nueva conversación
                      </button>
                    )}
                  </div>
                </div>
              )}
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

          {!isVerified ? (
            <div className="flex justify-center">
              <TurnstileWidget
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || ""}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setIsVerified(true);
                }}
              />
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
}
