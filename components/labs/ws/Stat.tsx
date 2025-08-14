// components/labs/ws/Stat.tsx
"use client";

export function Stat({
  label,
  value,
  unit = "ms",
}: {
  label: string;
  value: number | null;
  unit?: string;
}) {
  const show = (v: number | null) =>
    v === null ? "—" : `${v}${unit ? ` ${unit}` : ""}`;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-bold text-white">{show(value)}</div>
    </div>
  );
}
