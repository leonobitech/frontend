"use client";

import { Stat } from "@/components/labs/ws/Stat";

export type MetricsRT = {
  count: number;
  min: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  mean: number;
};

export function StatsGridRT({ m }: { m?: MetricsRT | null }) {
  if (!m) {
    // Placeholder vacío para no romper layout (opcional)
    return (
      <div className="ml-auto grid grid-cols-4 md:grid-cols-8 gap-2 opacity-70">
        <Stat label="min" value={0} />
        <Stat label="mean" value={0} />
        <Stat label="p50" value={0} />
        <Stat label="p90" value={0} />
        <Stat label="p95" value={0} />
        <Stat label="p99" value={0} />
        <Stat label="max" value={0} />
        <Stat label="n" value={0} />
      </div>
    );
  }

  return (
    <div className="ml-auto grid grid-cols-4 md:grid-cols-8 gap-2">
      <Stat label="min" value={m.min} />
      <Stat label="mean" value={m.mean} />
      <Stat label="p50" value={m.p50} />
      <Stat label="p90" value={m.p90} />
      <Stat label="p95" value={m.p95} />
      <Stat label="p99" value={m.p99} />
      <Stat label="max" value={m.max} />
      <Stat label="n" value={m.count} />
    </div>
  );
}
