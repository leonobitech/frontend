"use client";
import { useCallback, useRef, useState } from "react";

export type PreparedOffer = { sdp: string; type: RTCSdpType };

// Peer preparado para la RTCPeerConnection
export type PreparedPeer = {
  pc: RTCPeerConnection;
  offer: PreparedOffer;
  channels: {
    ctrl: RTCDataChannel;
    chat: RTCDataChannel;
    binary: RTCDataChannel;
  };
  applyRemoteAnswer: (sdp: string) => Promise<void>;
  addRemoteIce: (cand: RTCIceCandidateInit) => Promise<void>;
  mute: () => Promise<void>;
  unmute: () => Promise<void>;
  replaceMicByDeviceId: (deviceId: string) => Promise<void>;
  close: () => void;
};

export type WebRTCConfig = {
  onLocalCandidate?: (c: RTCIceCandidateInit) => void;
  onConnectionState?: (s: RTCPeerConnectionState) => void;
  onRemoteTrack?: (ev: RTCTrackEvent) => void;
  audio?: {
    enabled: boolean;
    deviceId?: string | null;
    constraints?: MediaTrackConstraints;
  };
};

// STUN únicamente (Google STUNs)
const STUN_ICE: RTCIceServer[] = [
  {
    urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"],
  },
];

export function usePreparedWebRTC() {
  // la instancia viva del RTCPeerConnection.
  const pcRef = useRef<RTCPeerConnection | null>(null);
  // el sender de la pista de audio actual.
  const audioSenderRef = useRef<RTCRtpSender | null>(null);
  // el track del micrófono activo.
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);

  const [state, setState] = useState<RTCPeerConnectionState>("new");

  const prepare = useCallback(
    async (cfg: WebRTCConfig = {}): Promise<PreparedPeer> => {
      // 1) RTCPeerConnection con BUNDLE y STUN only
      const pc = new RTCPeerConnection({
        iceServers: STUN_ICE,
        bundlePolicy: "max-bundle",
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setState(pc.connectionState);
        cfg.onConnectionState?.(pc.connectionState);
      };
      pc.onicecandidate = (ev) => {
        if (ev.candidate) cfg.onLocalCandidate?.(ev.candidate.toJSON());
      };
      pc.ontrack = (ev) => cfg.onRemoteTrack?.(ev);

      // 2) Transceiver audio sendrecv + Opus prioritario
      const audioTransceiver = pc.addTransceiver("audio", {
        direction: "sendrecv",
      });
      const caps = RTCRtpSender.getCapabilities("audio");
      if (caps?.codecs?.length) {
        const opus = caps.codecs.filter(
          (c) => c.mimeType.toLowerCase() === "audio/opus"
        );
        const rest = caps.codecs.filter(
          (c) => c.mimeType.toLowerCase() !== "audio/opus"
        );
        if (opus.length) {
          try {
            audioTransceiver.setCodecPreferences([...opus, ...rest]);
          } catch {}
        }
      }

      // Micro opcional (sin renegociar)
      if (cfg.audio?.enabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: cfg.audio.deviceId
                ? { exact: cfg.audio.deviceId }
                : undefined,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              ...(cfg.audio.constraints ?? {}),
            },
            video: false,
          });
          const track = stream.getAudioTracks()[0] ?? null;
          if (track) {
            await audioTransceiver.sender.replaceTrack(track);
            audioTrackRef.current = track;
          }
        } catch {}
      }
      audioSenderRef.current = audioTransceiver.sender;

      // 3) DataChannels antes de la oferta
      const dcCtrl = pc.createDataChannel("ctrl", {
        ordered: false,
        maxRetransmits: 0,
        protocol: "ctrl",
      });
      const dcChat = pc.createDataChannel("chat", {
        ordered: true,
        protocol: "chat",
      });
      const dcBin = pc.createDataChannel("binary", {
        ordered: false,
        maxPacketLifeTime: 500,
        protocol: "binary",
      });

      // 4) Oferta única + Trickle ICE
      const offer = await pc.createOffer({
        offerToReceiveAudio: true, // solo audio
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      return {
        pc,
        offer: { sdp: offer.sdp ?? "", type: offer.type },
        channels: { ctrl: dcCtrl, chat: dcChat, binary: dcBin },

        applyRemoteAnswer: async (sdp: string) => {
          await pc.setRemoteDescription({ type: "answer", sdp });
        },

        addRemoteIce: async (cand: RTCIceCandidateInit) => {
          try {
            await pc.addIceCandidate(cand);
          } catch {}
        },

        mute: async () => {
          if (audioSenderRef.current)
            await audioSenderRef.current.replaceTrack(null);
        },

        unmute: async () => {
          if (!audioSenderRef.current) return;
          const t = audioTrackRef.current;
          if (t && t.readyState === "live") {
            await audioSenderRef.current.replaceTrack(t);
            return;
          }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            const track = stream.getAudioTracks()[0] ?? null;
            audioTrackRef.current = track;
            await audioSenderRef.current.replaceTrack(track);
          } catch {}
        },

        replaceMicByDeviceId: async (deviceId: string) => {
          if (!audioSenderRef.current) return;
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: { exact: deviceId } },
              video: false,
            });
            const track = stream.getAudioTracks()[0] ?? null;
            audioTrackRef.current = track;
            await audioSenderRef.current.replaceTrack(track);
          } catch {}
        },

        close: () => {
          dcCtrl.close();
          dcChat.close();
          dcBin.close();
          pc.getSenders().forEach((s) => s.track && s.track.stop());
          pc.getTransceivers().forEach((t) => t.stop());
          pc.close();
          setState("closed");
        },
      };
    },
    []
  );

  return { prepare, state };
}
