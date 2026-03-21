"use client";

import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";

export function AvatarVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  // Find the avatar's video track (not the user)
  const avatarTrack = tracks.find(
    (t) => !t.participant.identity.startsWith("user-"),
  );

  useEffect(() => {
    if (!avatarTrack?.publication?.track || !videoRef.current) return;
    avatarTrack.publication.track.attach(videoRef.current);
    return () => {
      avatarTrack.publication?.track?.detach(videoRef.current!);
    };
  }, [avatarTrack]);

  if (!avatarTrack) {
    return (
      <div className="flex items-center justify-center bg-[#1a1a1a] rounded-lg aspect-video">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="h-12 w-12 animate-pulse rounded-full bg-white/10 flex items-center justify-center">
            <Bot className="h-6 w-6" />
          </div>
          <span className="text-sm">Conectando avatar...</span>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full rounded-lg aspect-video object-cover bg-[#1a1a1a]"
    />
  );
}
