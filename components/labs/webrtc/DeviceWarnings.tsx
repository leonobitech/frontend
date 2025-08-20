"use client";
import React from "react";

type Props = {
  hasInputs: boolean;
  supportsSetSinkId: boolean;
};

export default function DeviceWarnings({
  hasInputs,
  supportsSetSinkId,
}: Props) {
  return (
    <div className="space-y-1">
      {!hasInputs && (
        <p className="text-sm text-amber-500">
          No se detecta micrófono. Conecta uno o concede permisos al navegador.
        </p>
      )}
      {!supportsSetSinkId && (
        <p className="text-xs text-gray-500">
          Cambiar la salida no está soportado en este navegador.
        </p>
      )}
    </div>
  );
}
