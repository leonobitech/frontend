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
        // Load TalkingHead module from public/ at runtime (bypasses bundler)
        const module = await import(
          /* webpackIgnore: true */
          "/talkinghead/talkinghead.mjs"
        );
        const TalkingHead = module.TalkingHead;

        head = new TalkingHead(containerRef.current!, {
          ttsEndpoint: null,
          lipsyncModules: "/talkinghead/",
          cameraView: "upper",
          cameraDistance: 0.4,
          cameraX: 0,
          cameraY: 0,
          avatarMood: "neutral",
          avatarMute: true,
          modelFPS: 30,
          modelPixelRatio: 1,
        });

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
              if (pct % 25 === 0) console.log(`Avatar loading: ${pct}%`);
            }
          }
        );

        headRef.current = head;
        onReady?.();
      } catch (err) {
        console.error("TalkingHead init failed:", err);
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
        // Load HeadAudio module from public/ at runtime
        const module = await import(
          /* webpackIgnore: true */
          "/talkinghead/headaudio.min.mjs"
        );
        const HeadAudio = module.HeadAudio || module.default;

        const headAudio = new HeadAudio(head.audioCtx, {
          workletUrl: "/talkinghead/headworklet.min.mjs",
          modelUrl: "/talkinghead/model-en-mixed.bin",
        });

        await headAudio.init();

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
      } catch (err) {
        console.error("HeadAudio connection failed:", err);
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
