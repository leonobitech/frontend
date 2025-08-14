// components/labs/ws/StatsGrid.tsx
"use client";

import type { Metrics } from "@/hooks/useWsMetrics";
import { Stat } from "./Stat";

export function StatsGrid({ m }: { m: Metrics }) {
  return (
    <div className="ml-auto grid grid-cols-5 md:grid-cols-10 gap-2">
      <Stat label="last" value={m.last} />
      <Stat label="avg" value={m.avg} />
      <Stat label="min" value={m.min} />
      <Stat label="max" value={m.max} />
      <Stat label="p95" value={m.p95} />
      <Stat label="p99" value={m.p99} />
      <Stat label="skew" value={m.skew} unit="ms" />
      <Stat label="sent" value={m.sent} unit="" />
      <Stat label="recv" value={m.recv} unit="" />
      <Stat label="lost" value={m.lost} unit="" />
    </div>
  );
}
