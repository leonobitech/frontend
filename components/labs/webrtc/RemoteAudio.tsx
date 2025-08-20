"use client";
import React, { RefObject } from "react";

type Props = {
  audioRef: RefObject<HTMLAudioElement | null>;
  label?: string;
  controls?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
};

export default function RemoteAudio({
  audioRef,
  label = "Reproducción de eco remoto",
  controls = true,
  autoPlay = true,
  playsInline = true,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-500">
        Audio remoto (eco desde el servidor):
      </div>
      <audio
        ref={audioRef}
        controls={controls}
        autoPlay={autoPlay}
        playsInline={playsInline}
        aria-label={label}
      />
    </div>
  );
}
