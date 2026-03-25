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
        });

        await head.showAvatar({
          url: avatarUrl,
          body: "F",
          avatarMood: "neutral",
          lipsyncLang: "en",
        });

        headRef.current = head;
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
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900"
      style={{ minHeight: "300px" }}
    />
  );
}
