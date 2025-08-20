"use client";

import React, { RefObject } from "react";

export type ConnectStatus = "idle" | "connecting" | "open" | "closed" | "error";

type Props = {
  status: ConnectStatus;
  loading: boolean;

  volume: number;
  onVolumeChange: (v: number) => void;

  remoteAudioRef: RefObject<HTMLAudioElement | null>;

  onConnect: () => void | Promise<void>;
  onDisconnect: () => void;
};

export default function AudioControls({
  status,
  loading,
  volume,
  onVolumeChange,
  remoteAudioRef,
  onConnect,
  onDisconnect,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 w-full">
      {/* Botones */}
      <div className="flex items-center gap-2">
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

        {/* Pill de estado con ancho fijo para evitar saltos */}
        <span
          className="ml-2 inline-block text-sm min-w-[110px]"
          aria-live="polite"
        >
          Estado: <b>{status}</b>
        </span>
      </div>

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
    </div>
  );
}
