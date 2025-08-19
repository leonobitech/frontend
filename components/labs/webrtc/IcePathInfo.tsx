"use client";

/**
 * IcePathInfo
 * -----------
 * Muestra estado ICE + ruta (transporte y tipos de candidatos) y endpoints.
 */

export type IceInfo = {
  transport: "udp" | "tcp" | "unknown";
  local: {
    type: "host" | "srflx" | "prflx" | "relay" | "unknown";
    address?: string;
    port?: number;
    networkType?: string;
  };
  remote: {
    type: "host" | "srflx" | "prflx" | "relay" | "unknown";
    address?: string;
    port?: number;
    networkType?: string;
  };
  pathLabel: string; // ej: "udp / srflx→srflx"
};

export function IcePathInfo({
  iceState,
  ice,
}: {
  iceState: string | null;
  ice: IceInfo | null;
}) {
  return (
    <div className="text-xs text-gray-500 mt-2 space-y-1">
      <div>
        ICE: <b>{iceState ?? "—"}</b>
        {ice?.pathLabel && (
          <>
            {" · "}Ruta: <b>{ice.pathLabel}</b>
          </>
        )}
      </div>
      {ice && (
        <div className="text-[11px]">
          Local: {ice.local.type}
          {ice.local.address ? ` ${ice.local.address}` : ""}
          {typeof ice.local.port === "number" ? `:${ice.local.port}` : ""} ·
          Remote: {ice.remote.type}
          {ice.remote.address ? ` ${ice.remote.address}` : ""}
          {typeof ice.remote.port === "number"
            ? `:${ice.remote.port}`
            : ""}{" "}
          {ice.transport !== "unknown"
            ? `· ${ice.transport.toUpperCase()}`
            : ""}
        </div>
      )}
    </div>
  );
}
