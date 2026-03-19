"use client";

import { useCallback } from "react";
import {
  useLocalParticipant,
} from "@livekit/components-react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceControlsProps {
  onDisconnect: () => void;
}

export function VoiceControls({ onDisconnect }: VoiceControlsProps) {
  const { localParticipant } = useLocalParticipant();
  const isMuted = !localParticipant.isMicrophoneEnabled;

  const toggleMic = useCallback(() => {
    localParticipant.setMicrophoneEnabled(isMuted);
  }, [localParticipant, isMuted]);

  return (
    <div className="flex items-center justify-center gap-6 px-4 py-3 bg-[#2B2B2B] border-t border-white/5 z-10 relative">
      {/* Mic toggle */}
      <button
        onClick={toggleMic}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-all",
          isMuted
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : "bg-white/10 text-[#D1D5DB] hover:bg-white/15"
        )}
        aria-label={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>

      {/* Hang up */}
      <button
        onClick={onDisconnect}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20"
        aria-label="Terminar llamada"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}
