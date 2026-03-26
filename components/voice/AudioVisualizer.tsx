"use client";

import { useEffect, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";

interface AudioVisualizerProps {
  barCount?: number;
  className?: string;
}

export function AudioVisualizer({
  barCount = 64,
  className = "",
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    let audioCtx: AudioContext | null = null;

    const connectAnalyser = (mediaTrack: MediaStreamTrack) => {
      if (analyserRef.current) return;

      audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;

      const source = audioCtx.createMediaStreamSource(new MediaStream([mediaTrack]));
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !analyserRef.current) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        const w = canvas.width;
        const h = canvas.height;
        const centerY = h / 2;
        ctx.clearRect(0, 0, w, h);

        const barWidth = w / barCount;
        const gap = 1;

        for (let i = 0; i < barCount; i++) {
          const centerIdx = Math.floor(barCount / 2);
          const freqIdx = Math.abs(i - centerIdx);
          const val = dataArray[freqIdx] || 0;
          const barHeight = (val / 255) * centerY * 0.85;

          const x = i * barWidth;
          const alpha = 0.3 + (val / 255) * 0.5;

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fillRect(x + gap / 2, centerY - barHeight, barWidth - gap, barHeight);
          ctx.fillRect(x + gap / 2, centerY, barWidth - gap, barHeight);
        }

        animRef.current = requestAnimationFrame(draw);
      };
      draw();
    };

    const handleTrack = (track: any, _pub: any, participant: any) => {
      if (track.kind === Track.Kind.Audio && !participant.identity.startsWith("user-")) {
        if (track.mediaStreamTrack) connectAnalyser(track.mediaStreamTrack);
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrack);

    for (const p of room.remoteParticipants.values()) {
      if (!p.identity.startsWith("user-")) {
        for (const pub of p.audioTrackPublications.values()) {
          if (pub.track?.mediaStreamTrack) connectAnalyser(pub.track.mediaStreamTrack);
        }
      }
    }

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrack);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      analyserRef.current = null;
      if (audioCtx) audioCtx.close().catch(() => {});
    };
  }, [room, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={120}
      className={`w-full ${className}`}
      style={{ height: "60px" }}
    />
  );
}
