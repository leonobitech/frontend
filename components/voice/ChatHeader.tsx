"use client";

import { useVoiceAssistant } from "@livekit/components-react";
import { Bot, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  onDisconnect: () => void;
}

type AgentState = "disconnected" | "connecting" | "initializing" | "listening" | "thinking" | "speaking";

const STATUS_LABELS: Record<AgentState, string> = {
  disconnected: "Desconectado",
  connecting: "Conectando...",
  initializing: "Inicializando...",
  listening: "En linea",
  thinking: "Escribiendo...",
  speaking: "Hablando...",
};

export function ChatHeader({ onDisconnect }: ChatHeaderProps) {
  const voiceAssistant = useVoiceAssistant();
  const agentState = (voiceAssistant.state ?? "connecting") as AgentState;
  const isOnline = ["listening", "thinking", "speaking"].includes(agentState);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-[#2B2B2B] border-b border-white/5 z-10 relative">
      {/* Back / disconnect */}
      <button
        onClick={onDisconnect}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#D1D5DB] hover:bg-white/10 transition-colors"
        aria-label="Terminar llamada"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Agent avatar */}
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3A3A3A]">
          <Bot className="h-5 w-5 text-[#D1D5DB]" />
        </div>
        {/* Online indicator */}
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#2B2B2B]",
            isOnline ? "bg-green-500" : "bg-gray-500"
          )}
        />
      </div>

      {/* Agent info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[#D1D5DB] truncate">
          Leonobitech AI
        </h3>
        <p
          className={cn(
            "text-xs truncate",
            agentState === "speaking" || agentState === "thinking"
              ? "text-green-400"
              : "text-gray-400"
          )}
        >
          {STATUS_LABELS[agentState] ?? agentState}
        </p>
      </div>
    </div>
  );
}
