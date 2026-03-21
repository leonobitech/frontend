"use client";

import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";

export function AvatarVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Subscribe to ALL video sources (Camera, ScreenShare, etc.)
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Unknown],
    { onlySubscribed: false },
  );

  // Find the avatar's video track (identity: bey-avatar-agent)
  const avatarTrack = tracks.find(
    (t) =>
      t.publication?.kind === Track.Kind.Video &&
      !t.participant.identity.startsWith("user-"),
  );

  useEffect(() => {
    if (tracks.length > 0) {
      console.log(
        "[AvatarVideo] tracks:",
        tracks.map((t) => ({
          identity: t.participant.identity,
          source: t.source,
          kind: t.publication?.kind,
          subscribed: t.publication?.isSubscribed,
          trackSid: t.publication?.trackSid,
        })),
      );
    }
  }, [tracks]);

  useEffect(() => {
    const track = avatarTrack?.publication?.track;
    if (!track || !videoRef.current) return;

    track.attach(videoRef.current);
    console.log("[AvatarVideo] attached track:", avatarTrack?.participant.identity);

    return () => {
      track.detach(videoRef.current!);
    };
  }, [avatarTrack]);

  if (!avatarTrack) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[#1a1a1a] rounded-lg">
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
      className="w-full h-full rounded-lg object-cover bg-[#1a1a1a]"
    />
  );
}
