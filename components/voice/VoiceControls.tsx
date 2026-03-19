"use client";

import { useCallback } from "react";
import {
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceControlsProps {
  onDisconnect: () => void;
}

type AgentState =
  | "disconnected"
  | "connecting"
  | "initializing"
  | "listening"
  | "thinking"
  | "speaking";

const STATUS_LABELS: Record<AgentState, string> = {
  disconnected: "Desconectado",
  connecting: "Conectando...",
  initializing: "Inicializando...",
  listening: "Escuchando...",
  thinking: "Pensando...",
  speaking: "Hablando...",
};

export function VoiceControls({ onDisconnect }: VoiceControlsProps) {
  const { localParticipant } = useLocalParticipant();
  const voiceAssistant = useVoiceAssistant();

  const isMuted = !localParticipant.isMicrophoneEnabled;
  const agentState = (voiceAssistant.state ?? "connecting") as AgentState;

  const toggleMic = useCallback(() => {
    localParticipant.setMicrophoneEnabled(isMuted);
  }, [localParticipant, isMuted]);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#2B2B2B] px-4 py-3">
      {/* Status */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            agentState === "speaking"
              ? "bg-green-500 animate-pulse"
              : agentState === "thinking"
                ? "bg-yellow-500 animate-pulse"
                : agentState === "listening"
                  ? "bg-green-500"
                  : "bg-gray-400"
          )}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {STATUS_LABELS[agentState] ?? agentState}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMic}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all",
            isMuted
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
          )}
          aria-label={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <button
          onClick={onDisconnect}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600 hover:shadow-lg"
          aria-label="Terminar llamada"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
