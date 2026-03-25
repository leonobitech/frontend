"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";

interface TalkingHeadAvatarProps {
  avatarUrl?: string;
  cameraView?: string;
  cameraDistance?: number;
  cameraY?: number;
  onReady?: () => void;
}

export function TalkingHeadAvatar({
  avatarUrl = "/talkinghead/brunette.glb",
  cameraView = "upper",
  cameraDistance = 0.4,
  cameraY = 0,
  onReady,
}: TalkingHeadAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<any>(null);
  const headAudioRef = useRef<any>(null);
  const initRef = useRef(false);
  const room = useRoomContext();

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    let head: any;

    async function init() {
      try {
        // @ts-ignore — runtime import from public/, self-contained bundle with Three.js
        const module = await import(/* webpackIgnore: true */ "/talkinghead/talkinghead-bundle.mjs");
        const TalkingHead = module.TalkingHead;
        if (!TalkingHead) return;

        head = new TalkingHead(containerRef.current!, {
          ttsEndpoint: null,
          lipsyncModules: [],
          cameraView,
          cameraDistance,
          cameraX: 0,
          cameraY,
          avatarMood: "neutral",
          avatarMute: true,
          modelFPS: 30,
          modelPixelRatio: 1,
          background: "#2B2B2B",
        });

        await head.showAvatar({
          url: avatarUrl,
          body: "F",
          avatarMood: "neutral",
          lipsyncLang: "en",
        });

        // Set camera view after avatar loads
        try {
          head.setView(cameraView);
        } catch {}

        headRef.current = head;

        // Tech portal entry sound
        try {
          const ctx = new AudioContext();
          const now = ctx.currentTime;

          // Rising sweep — sci-fi portal opening
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(200, now);
          osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
          gain1.gain.setValueAtTime(0.15, now);
          gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
          osc1.connect(gain1).connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.6);

          // Shimmer overtone
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(800, now + 0.1);
          osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.5);
          gain2.gain.setValueAtTime(0.08, now + 0.1);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
          osc2.connect(gain2).connect(ctx.destination);
          osc2.start(now + 0.1);
          osc2.stop(now + 0.7);

          // Confirmation chime
          const osc3 = ctx.createOscillator();
          const gain3 = ctx.createGain();
          osc3.type = "sine";
          osc3.frequency.setValueAtTime(880, now + 0.5);
          osc3.frequency.setValueAtTime(1320, now + 0.65);
          gain3.gain.setValueAtTime(0.12, now + 0.5);
          gain3.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
          osc3.connect(gain3).connect(ctx.destination);
          osc3.start(now + 0.5);
          osc3.stop(now + 1.0);

          setTimeout(() => ctx.close(), 1500);
        } catch {}

        onReady?.();
      } catch (err) {
        console.error("[TalkingHead] Init failed:", err);
      }
    }

    init();

    return () => {
      if (head) {
        try { head.stop?.(); } catch {}
      }
    };
  }, [avatarUrl, onReady]);

  const connectAudioToLipSync = useCallback(
    async (audioTrack: MediaStreamTrack) => {
      const head = headRef.current;
      if (!head || !head.audioCtx) return;

      try {
        await head.audioCtx.audioWorklet.addModule("/talkinghead/headworklet.min.mjs");

        // @ts-ignore — runtime import from public/
        const module = await import(/* webpackIgnore: true */ "/talkinghead/headaudio.min.mjs");
        const HeadAudio = module.HeadAudio || module.default;

        const headAudio = new HeadAudio(head.audioCtx, {});
        await headAudio.loadModel("/talkinghead/model-en-mixed.bin");

        const mediaStream = new MediaStream([audioTrack]);
        const sourceNode = head.audioCtx.createMediaStreamSource(mediaStream);
        sourceNode.connect(headAudio);

        headAudio.onvalue = (key: string, value: number) => {
          if (head.mtAvatar && head.mtAvatar[key]) {
            head.mtAvatar[key].newvalue = value;
            head.mtAvatar[key].needsUpdate = true;
          }
        };

        headAudioRef.current = headAudio;

        const updateLoop = () => {
          headAudio.update(16);
          requestAnimationFrame(updateLoop);
        };
        updateLoop();
      } catch (err) {
        console.error("[HeadAudio] Connection failed:", err);
      }
    },
    []
  );

  useEffect(() => {
    if (!room) return;

    const handleTrackSubscribed = (
      track: any,
      publication: any,
      participant: any
    ) => {
      if (
        track.kind === Track.Kind.Audio &&
        !participant.identity.startsWith("user-")
      ) {
        const mediaTrack = track.mediaStreamTrack;
        if (mediaTrack) connectAudioToLipSync(mediaTrack);
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

    for (const p of room.remoteParticipants.values()) {
      if (!p.identity.startsWith("user-")) {
        for (const pub of p.audioTrackPublications.values()) {
          if (pub.track?.mediaStreamTrack) {
            connectAudioToLipSync(pub.track.mediaStreamTrack);
          }
        }
      }
    }

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    };
  }, [room, connectAudioToLipSync]);

  return (
    <div className="w-full h-full overflow-hidden">
      <div
        ref={containerRef}
        className="w-full"
        style={{ backgroundColor: "#2B2B2B", height: "125%", marginTop: "-25%" }}
      />
    </div>
  );
}
