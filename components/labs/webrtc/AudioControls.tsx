"use client";

import React, { RefObject } from "react";
import { hasSetSinkId } from "./utils";

export type ConnectStatus = "idle" | "connecting" | "open" | "closed" | "error";

type Props = {
  status: ConnectStatus;
  loading: boolean;

  volume: number;
  onVolumeChange: (v: number) => void;

  sinks: MediaDeviceInfo[];
  remoteAudioRef: RefObject<HTMLAudioElement | null>;

  onConnect: () => void | Promise<void>;
  onDisconnect: () => void;

  needsUserGesture: boolean;
  onResolveAutoplay: () => void | Promise<void>;
};

export default function AudioControls({
  status,
  loading,
  volume,
  onVolumeChange,
  sinks,
  remoteAudioRef,
  onConnect,
  onDisconnect,
  needsUserGesture,
  onResolveAutoplay, // ← ¡destructurado!
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Conectar / Desconectar */}
      <button
        onClick={onConnect}
        className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
        disabled={loading || status === "connecting" || status === "open"}
      >
        Conectar
      </button>

      <button
        onClick={onDisconnect}
        className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
        disabled={status !== "open" && status !== "connecting"}
      >
        Desconectar
      </button>

      {/* Estado en vivo para lectores de pantalla */}
      <span className="ml-2" aria-live="polite">
        Estado: <b>{status}</b>
      </span>

      {/* Volumen */}
      <div className="flex items-center gap-2">
        <label htmlFor="volume-slider" className="text-sm">
          Volumen
        </label>
        <input
          id="volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.currentTarget.value))}
        />
        <button
          className="text-sm border px-2 py-1 rounded"
          onClick={() => {
            const el = remoteAudioRef.current;
            if (el) el.muted = !el.muted;
          }}
        >
          Mute/Unmute
        </button>
      </div>

      {/* Selector de salida (sink) */}
      {sinks.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="audio-sink-select" className="text-sm">
            Salida
          </label>
          <select
            id="audio-sink-select"
            className="border px-2 py-1 rounded"
            onChange={async (e) => {
              const el = remoteAudioRef.current;
              const id = e.currentTarget.value;
              if (el && hasSetSinkId(el) && window.isSecureContext) {
                try {
                  await el.setSinkId(id);
                } catch (err) {
                  console.warn("setSinkId failed:", err);
                }
              }
            }}
          >
            <option value="default">Default</option>
            {sinks.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || d.deviceId}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Fallback cuando el autoplay fue bloqueado */}
      {needsUserGesture && (
        <div>
          <button
            className="mt-2 px-3 py-2 rounded bg-blue-600 text-white"
            onClick={onResolveAutoplay} // ← usar el callback del padre
          >
            Reproducir audio
          </button>
          <p className="text-xs text-gray-500 mt-1">
            El navegador bloqueó la reproducción automática. Tocá “Reproducir
            audio”.
          </p>
        </div>
      )}
    </div>
  );
}
