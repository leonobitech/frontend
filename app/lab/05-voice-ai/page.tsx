// app/lab/04-webrtc-audio/page.tsx
"use client";

import { useRef } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

import AudioControls from "@/components/labs/webrtc/AudioControls";
import InputOutputSelector from "@/components/labs/webrtc/InputOutputSelector";
import DeviceWarnings from "@/components/labs/webrtc/DeviceWarnings";
import AutoplayPrompt from "@/components/labs/webrtc/AutoplayPrompt";
import ErrorAlert from "@/components/labs/webrtc/ErrorAlert";
import RemoteAudio from "@/components/labs/webrtc/RemoteAudio";
import QualitySection from "@/components/labs/webrtc/QualitySection";

import { useAudioDevices } from "@/hooks/webrtc/useAudioDevices";
import { useWebRTCAudio } from "@/hooks/webrtc/useWebRTCAudio";

export default function Lab05VoiceAIPage() {
  const { user, session, loading } = useSessionGuard();
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Dispositivos + sink switching
  const {
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    supportsSetSinkId,
    canConnect,
    setSelectedInputId,
    handleChangeOutput,
  } = useAudioDevices(remoteAudioRef);

  // Meta para el backend (igual que antes)
  const screenRes = `${
    typeof window !== "undefined" ? window.screen.width : 0
  }x${typeof window !== "undefined" ? window.screen.height : 0}`;
  const meta = buildClientMetaWithResolution(screenRes, {
    label: "leonobitech",
  });

  // WebRTC
  const {
    status,
    err,
    setErr,
    needsUserGesture,
    setNeedsUserGesture,
    mvp,
    ice,
    connect,
    disconnect,
  } = useWebRTCAudio({
    user,
    session,
    signalingPath: "/api/lab/05-voice-ai",
    audioRef: remoteAudioRef,
    volume: 1, // el slider lo sobreescribe en el ref directamente
    selectedInputId,
    selectedOutputId,
    meta: { ...meta, path: "/lab/05-voice-ai", method: "POST" },
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Lab 04 — WebRTC Audio (Loopback)</h1>
      <p className="text-gray-600">
        Envía micrófono → backend → eco RTP → reproduce audio remoto.
      </p>

      <AudioControls
        status={status}
        loading={loading}
        volume={1}
        onVolumeChange={(v) => {
          const el = remoteAudioRef.current;
          if (el) el.volume = v;
        }}
        remoteAudioRef={remoteAudioRef}
        onConnect={
          canConnect
            ? connect
            : () =>
                setErr("No hay dispositivo de entrada (micrófono) disponible.")
        }
        onDisconnect={disconnect}
      />

      <DeviceWarnings
        hasInputs={inputDevices.length > 0}
        supportsSetSinkId={supportsSetSinkId}
      />

      <InputOutputSelector
        inputs={inputDevices}
        outputs={supportsSetSinkId ? outputDevices : []}
        selectedInputId={selectedInputId}
        selectedOutputId={selectedOutputId}
        onChangeInput={(id) => setSelectedInputId(id || null)}
        onChangeOutput={handleChangeOutput}
      />

      <AutoplayPrompt
        show={needsUserGesture}
        audioRef={remoteAudioRef}
        onResolved={() => setNeedsUserGesture(false)}
      />
      <ErrorAlert error={err} />
      <RemoteAudio audioRef={remoteAudioRef} />
      <QualitySection stats={mvp} ice={ice} />
    </div>
  );
}
