"use client";

import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useRef, useState } from "react";

export function AvatarVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachedTrackSid = useRef<string | null>(null);
  const startTime = useRef(Date.now());
  const [progress, setProgress] = useState(0);

  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  const avatarTrack = tracks.find(
    (t) => !t.participant.identity.startsWith("user-"),
  );

  const trackSid = avatarTrack?.publication?.trackSid;
  const track = avatarTrack?.publication?.track;

  // Progress bar animation (~15 seconds)
  useEffect(() => {
    if (avatarTrack) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min((elapsed / 15000) * 100, 95);
      setProgress(pct);
    }, 100);

    return () => clearInterval(interval);
  }, [avatarTrack]);

  useEffect(() => {
    if (!track || !videoRef.current || trackSid === attachedTrackSid.current) return;

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
        <div className="flex flex-col items-center gap-4 w-full max-w-xs px-6">
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/40 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            Preparando avatar...
          </span>
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
