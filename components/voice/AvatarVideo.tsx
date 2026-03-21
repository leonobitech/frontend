"use client";

import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";

export function AvatarVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachedTrackSid = useRef<string | null>(null);

  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  // Find the avatar's video track (not the user)
  const avatarTrack = tracks.find(
    (t) => !t.participant.identity.startsWith("user-"),
  );

  const trackSid = avatarTrack?.publication?.trackSid;
  const track = avatarTrack?.publication?.track;

  // Only attach/detach when the actual track changes (by SID), not on every render
  useEffect(() => {
    if (!track || !videoRef.current || trackSid === attachedTrackSid.current) return;

    // Detach previous if any
    if (attachedTrackSid.current) {
      track.detach(videoRef.current);
    }

    track.attach(videoRef.current);
    attachedTrackSid.current = trackSid ?? null;

    return () => {
      if (videoRef.current) {
        track.detach(videoRef.current);
      }
      attachedTrackSid.current = null;
    };
  }, [track, trackSid]);

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
      style={{ background: "#1a1a1a" }}
      className="w-full h-full rounded-lg object-cover"
    />
  );
}
