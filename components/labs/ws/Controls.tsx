// components/labs/ws/Controls.tsx
"use client";
import React from "react";

export function Controls({
  url,
  setUrl,
  onConnect,
  onDisconnect,
  onPing,
  disabled,
  placeholder,
}: {
  url: string;
  setUrl: React.Dispatch<React.SetStateAction<string>>; // 👈 cambio clave
  onConnect: () => void;
  onDisconnect: () => void;
  onPing: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-3">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 rounded-lg border border-gray-300 font-mono"
      />
      <button
        onClick={onConnect}
        disabled={disabled}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-900 text-white disabled:opacity-60"
      >
        Conectar
      </button>
      <button
        onClick={onDisconnect}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-900 text-white"
      >
        Desconectar
      </button>
      <button
        onClick={onPing}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-700 text-white col-span-3 sm:col-span-1"
        title="PING::ts_cli::seq"
      >
        Ping
      </button>
    </div>
  );
}
