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
import { useWebRTCChatDC } from "@/hooks/webrtc/useWebRTCChatDC"; // ← NUEVO para DataChannel

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

  // WebRTC (AUDIO) — tu hook existente
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

  // WebRTC (DataChannel "chat") — hook nuevo, independiente
  const {
    dcStatus,
    sttPartial,
    agentLines,
    events,
    err: dcErr,
    connectChat,
    disconnectChat,
    sendPing,
    sendEcho,
    sendBargeIn,
  } = useWebRTCChatDC("/api/lab/05-voice-ai");

  // Envolvemos conectar/desconectar para no romper lo que ya funciona
  const onConnectAll = async () => {
    if (!canConnect) {
      setErr("No hay dispositivo de entrada (micrófono) disponible.");
      return;
    }
    await connect(); // audio
    await connectChat({
      user: user
        ? { id: user.id, role: user.role, email: user.email }
        : undefined,
      session: session
        ? {
            id: session.id,
            isRevoked: session.isRevoked,
            expiresAt: session.expiresAt,
          }
        : undefined,
      meta: { ...meta, path: "/lab/05-voice-ai", method: "POST" },
    }); // chat
  };

  const onDisconnectAll = () => {
    disconnect(); // audio
    disconnectChat(); // chat
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">05 — Voice AI (Loopback)</h1>
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
        onConnect={onConnectAll}
        onDisconnect={onDisconnectAll}
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
      <ErrorAlert error={err || dcErr} />
      <RemoteAudio audioRef={remoteAudioRef} />
      <QualitySection stats={mvp} ice={ice} />

      {/* --- Bloques mínimos para visualizar DataChannel --- */}
      <div className="rounded-2xl shadow p-3">
        <div className="font-semibold">STT (parcial)</div>
        <div className="mt-2 min-h-12 whitespace-pre-wrap">
          {sttPartial || "—"}
        </div>
        <div className="mt-2 text-xs text-gray-500">DC: {dcStatus}</div>
        <div className="mt-3 flex gap-2">
          <button className="rounded-2xl px-3 py-2 shadow" onClick={sendPing}>
            Ping
          </button>
          <button
            className="rounded-2xl px-3 py-2 shadow"
            onClick={() => sendEcho("Hola desde el front ✌️")}
          >
            Echo test
          </button>
          <button
            className="rounded-2xl px-3 py-2 shadow"
            onClick={sendBargeIn}
          >
            Barge-in
          </button>
        </div>
      </div>

      <div className="rounded-2xl shadow p-3">
        <div className="font-semibold">Agente</div>
        <ul className="mt-2 space-y-1">
          {agentLines.map((t, i) => (
            <li key={i} className="text-sm">
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl shadow p-3">
        <div className="font-semibold">Eventos</div>
        <ul className="mt-2 space-y-1 max-h-64 overflow-auto">
          {events.map((e, i) => (
            <li key={i} className="text-xs">
              {e}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
