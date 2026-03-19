"use client";

import { useCallback } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesktopControlsProps {
  onDisconnect: () => void;
}

export function DesktopControls({ onDisconnect }: DesktopControlsProps) {
  const { localParticipant } = useLocalParticipant();
  const isMuted = !localParticipant.isMicrophoneEnabled;

  const toggleMic = useCallback(() => {
    localParticipant.setMicrophoneEnabled(isMuted);
  }, [localParticipant, isMuted]);

  return (
    <div className="flex items-center justify-center gap-4 px-4 py-3 bg-[#2B2B2B] rounded-b-xl border-t border-white/5">
      <button
        onClick={toggleMic}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-all",
          isMuted
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : "bg-white/10 text-[#D1D5DB] hover:bg-white/15"
        )}
        aria-label={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
      >
        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>

      <button
        onClick={onDisconnect}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20"
        aria-label="Terminar llamada"
      >
        <PhoneOff className="h-4 w-4" />
      </button>
    </div>
  );
}
