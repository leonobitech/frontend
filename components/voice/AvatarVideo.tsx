"use client";

import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useRef, useState } from "react";

export function AvatarVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachedTrackSid = useRef<string | null>(null);
  const startTime = useRef(Date.now());
  const [progress, setProgress] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);

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
    if (videoPlaying) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min((elapsed / 15000) * 100, 95);
      setProgress(pct);
    }, 100);

    return () => clearInterval(interval);
  }, [videoPlaying]);

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

  // Show progress bar until video is actually rendering frames
  if (!videoPlaying) {
    return (
      <div className="relative w-full h-full">
        {/* Hidden video element that attaches and waits for first frame */}
        {avatarTrack && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlaying={() => setVideoPlaying(true)}
            className="absolute inset-0 opacity-0 pointer-events-none"
          />
        )}
        <div className="flex items-center justify-center w-full h-full bg-[#1a1a1a] rounded-lg">
          <div className="flex flex-col items-center gap-4 w-full max-w-xs px-6">
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.8), rgba(255,255,255,0.3))",
                  boxShadow: "0 0 8px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.3)",
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              Preparando avatar...
            </span>
          </div>
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
