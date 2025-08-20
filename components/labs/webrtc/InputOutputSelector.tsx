"use client";

import React from "react";

type Props = {
  // Dispositivos
  inputs: MediaDeviceInfo[];
  outputs: MediaDeviceInfo[];
  // Seleccionados
  selectedInputId: string | null;
  selectedOutputId: string | null;
  // Handlers
  onChangeInput: (id: string) => void;
  onChangeOutput: (id: string) => void;
};

export default function InputOutputSelector({
  inputs,
  outputs,
  selectedInputId,
  selectedOutputId,
  onChangeInput,
  onChangeOutput,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {/* Entrada */}
      <div className="flex items-center gap-2">
        <label htmlFor="audio-input-select" className="text-sm min-w-16">
          Entrada
        </label>
        <select
          id="audio-input-select"
          className="border px-2 py-1 rounded w-full"
          value={selectedInputId ?? ""}
          onChange={(e) => onChangeInput(e.currentTarget.value)}
        >
          <option value="">Default</option>
          {inputs.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Micrófono ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Salida */}
      <div className="flex items-center gap-2">
        <label htmlFor="audio-output-select" className="text-sm min-w-16">
          Salida
        </label>
        <select
          id="audio-output-select"
          className="border px-2 py-1 rounded w-full"
          value={selectedOutputId ?? "default"}
          onChange={(e) => onChangeOutput(e.currentTarget.value)}
        >
          <option value="default">Default</option>
          {outputs.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Salida ${i + 1}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
