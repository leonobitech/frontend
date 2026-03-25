"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";

interface TalkingHeadAvatarProps {
  avatarUrl?: string;
  onReady?: () => void;
}

export function TalkingHeadAvatar({
  avatarUrl = "/talkinghead/brunette.glb",
  onReady,
}: TalkingHeadAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<any>(null);
  const headAudioRef = useRef<any>(null);
  const initRef = useRef(false);
  const room = useRoomContext();

  // Initialize TalkingHead from public/ (runtime, no bundler)
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    let head: any;

    async function init() {
      try {
        console.log("[TalkingHead] Loading bundle...");
        // @ts-ignore — runtime import from public/, self-contained bundle with Three.js
        const module = await import(/* webpackIgnore: true */ "/talkinghead/talkinghead-bundle.mjs");
        console.log("[TalkingHead] Bundle loaded:", Object.keys(module));
        const TalkingHead = module.TalkingHead;

        if (!TalkingHead) {
          console.error("[TalkingHead] TalkingHead class not found in module");
          return;
        }

        console.log("[TalkingHead] Creating instance...");
        head = new TalkingHead(containerRef.current!, {
          ttsEndpoint: null,
          lipsyncModules: [],
          cameraView: "upper",
          cameraDistance: 0.4,
          cameraX: 0,
          cameraY: 0,
          avatarMood: "neutral",
          avatarMute: true,
          modelFPS: 30,
          modelPixelRatio: 1,
        });

        console.log("[TalkingHead] Loading avatar:", avatarUrl);
        await head.showAvatar(
          {
            url: avatarUrl,
            body: "F",
            avatarMood: "neutral",
            lipsyncLang: "en",
          },
          (ev: any) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              console.log(`[TalkingHead] Avatar loading: ${pct}%`);
            }
          }
        );

        console.log("[TalkingHead] Avatar ready!");
        headRef.current = head;
        onReady?.();
      } catch (err) {
        console.error("[TalkingHead] Init failed:", err);
      }
    }

    init();

    return () => {
      if (head) {
        try {
          head.stop?.();
        } catch {}
      }
    };
  }, [avatarUrl, onReady]);

  // Connect LiveKit agent audio to HeadAudio for lip-sync
  const connectAudioToLipSync = useCallback(
    async (audioTrack: MediaStreamTrack) => {
      const head = headRef.current;
      if (!head || !head.audioCtx) return;

      try {
        // Register AudioWorklet processor FIRST
        await head.audioCtx.audioWorklet.addModule("/talkinghead/headworklet.min.mjs");

        // Load HeadAudio module from public/ at runtime
        // @ts-ignore — runtime import from public/, not a bundled module
        const module = await import(/* webpackIgnore: true */ "/talkinghead/headaudio.min.mjs");
        const HeadAudio = module.HeadAudio || module.default;

        const headAudio = new HeadAudio(head.audioCtx, {});

        // Load the viseme detection model
        await headAudio.loadModel("/talkinghead/model-en-mixed.bin");

        // Create MediaStream source from the agent's audio track
        const mediaStream = new MediaStream([audioTrack]);
        const sourceNode = head.audioCtx.createMediaStreamSource(mediaStream);

        // Connect source → HeadAudio for viseme detection
        sourceNode.connect(headAudio.node);

        // HeadAudio sends viseme values to TalkingHead
        headAudio.onvalue = (key: string, value: number) => {
          if (head.mtAvatar && head.mtAvatar[key]) {
            head.mtAvatar[key].newvalue = value;
            head.mtAvatar[key].needsUpdate = true;
          }
        };

        headAudioRef.current = headAudio;
      } catch (err: any) {
        console.error("HeadAudio connection failed:", err?.message || err, err);
      }
    },
    []
  );

  // Listen for agent audio track from LiveKit room
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
        if (mediaTrack) {
          connectAudioToLipSync(mediaTrack);
        }
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

    // Check if agent audio already exists
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
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900"
      style={{ minHeight: "300px" }}
    />
  );
}
