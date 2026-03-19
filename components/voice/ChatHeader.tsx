"use client";

import { useVoiceAssistant } from "@livekit/components-react";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentState = "disconnected" | "connecting" | "initializing" | "listening" | "thinking" | "speaking";

const STATUS_LABELS: Record<AgentState, string> = {
  disconnected: "Desconectado",
  connecting: "Conectando...",
  initializing: "Inicializando...",
  listening: "En línea",
  thinking: "Pensando...",
  speaking: "Hablando...",
};

export function ChatHeader() {
  const voiceAssistant = useVoiceAssistant();
  const agentState = (voiceAssistant.state ?? "connecting") as AgentState;
  const isOnline = ["listening", "thinking", "speaking"].includes(agentState);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#2B2B2B] rounded-t-xl border-b border-white/5">
      <div className="relative">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3A3A3A]">
          <Bot className="h-4 w-4 text-[#D1D5DB]" />
        </div>
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#2B2B2B]",
            isOnline ? "bg-green-500" : "bg-gray-500"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-[#D1D5DB]">Leonobitech AI</h3>
        <p className={cn(
          "text-xs",
          agentState === "speaking" || agentState === "thinking" ? "text-green-400" : "text-gray-400"
        )}>
          {STATUS_LABELS[agentState] ?? agentState}
        </p>
      </div>
    </div>
  );
}
