"use client";
import React, { RefObject } from "react";

type Props = {
  show: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  onResolved: () => void;
};

export default function AutoplayPrompt({ show, audioRef, onResolved }: Props) {
  if (!show) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-amber-400">El navegador bloqueó autoplay.</span>
      <button
        className="px-2 py-1 rounded bg-blue-600 text-white"
        onClick={async () => {
          const el = audioRef.current;
          if (!el) return;
          try {
            await el.play();
            onResolved();
          } catch (e) {
            console.warn(e);
          }
        }}
      >
        Reproducir
      </button>
    </div>
  );
}
