"use client";

/**
 * StatsPanel
 * ----------
 * Muestra las métricas clave del MVP en tarjetas.
 */

export type MvpStats = {
  rttMs: number | null;
  jitterMs: number | null;
  lossPct: number | null;
  inKbps: number | null;
  outKbps: number | null;
  playoutMs: number | null;
  iceState: string | null;
};

function fmtMs(v: number | null) {
  return v == null ? "—" : `${Math.round(v)} ms`;
}
function fmtPct(v: number | null) {
  return v == null ? "—" : `${v.toFixed(1)}%`;
}
function fmtKbps(v: number | null) {
  return v == null ? "—" : `${Math.round(v)} kbps`;
}
function clsByThreshold(type: keyof MvpStats, v: number | null) {
  if (v == null) return "text-gray-500";
  switch (type) {
    case "rttMs":
      return v < 80
        ? "text-green-600"
        : v <= 150
        ? "text-yellow-600"
        : "text-red-600";
    case "jitterMs":
      return v < 20
        ? "text-green-600"
        : v <= 50
        ? "text-yellow-600"
        : "text-red-600";
    case "lossPct":
      return v < 1
        ? "text-green-600"
        : v <= 5
        ? "text-yellow-600"
        : "text-red-600";
    case "inKbps":
    case "outKbps":
      return v >= 12
        ? "text-green-600"
        : v >= 6
        ? "text-yellow-600"
        : "text-red-600";
    case "playoutMs":
      return v < 60
        ? "text-green-600"
        : v <= 120
        ? "text-yellow-600"
        : "text-red-600";
    default:
      return "";
  }
}

export function StatsPanel({ stats }: { stats: MvpStats }) {
  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="p-3 rounded-xl border">
        <div className="text-xs text-gray-500">Latencia RTT</div>
        <div
          className={`text-lg font-semibold ${clsByThreshold(
            "rttMs",
            stats.rttMs
          )}`}
        >
          {fmtMs(stats.rttMs)}
        </div>
      </div>

      <div className="p-3 rounded-xl border">
        <div className="text-xs text-gray-500">Jitter</div>
        <div
          className={`text-lg font-semibold ${clsByThreshold(
            "jitterMs",
            stats.jitterMs
          )}`}
        >
          {fmtMs(stats.jitterMs)}
        </div>
      </div>

      <div className="p-3 rounded-xl border">
        <div className="text-xs text-gray-500">Pérdida IN</div>
        <div
          className={`text-lg font-semibold ${clsByThreshold(
            "lossPct",
            stats.lossPct
          )}`}
        >
          {fmtPct(stats.lossPct)}
        </div>
      </div>

      <div className="p-3 rounded-xl border">
        <div className="text-xs text-gray-500">Bitrate IN</div>
        <div
          className={`text-lg font-semibold ${clsByThreshold(
            "inKbps",
            stats.inKbps
          )}`}
        >
          {fmtKbps(stats.inKbps)}
        </div>
      </div>

      <div className="p-3 rounded-xl border">
        <div className="text-xs text-gray-500">Bitrate OUT</div>
        <div
          className={`text-lg font-semibold ${clsByThreshold(
            "outKbps",
            stats.outKbps
          )}`}
        >
          {fmtKbps(stats.outKbps)}
        </div>
      </div>

      <div className="p-3 rounded-xl border">
        <div className="text-xs text-gray-500">Playout delay</div>
        <div
          className={`text-lg font-semibold ${clsByThreshold(
            "playoutMs",
            stats.playoutMs
          )}`}
        >
          {fmtMs(stats.playoutMs)}
        </div>
      </div>
    </div>
  );
}
