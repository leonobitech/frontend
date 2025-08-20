"use client";
import React from "react";
import { StatsPanel, type MvpStats } from "./StatsPanel";
import { IcePathInfo, type IceInfo } from "./IcePathInfo";

type Props = {
  stats: MvpStats;
  ice: IceInfo | null;
};

export default function QualitySection({ stats, ice }: Props) {
  return (
    <div className="space-y-4">
      <StatsPanel stats={stats} />
      <IcePathInfo iceState={stats.iceState} ice={ice} />
    </div>
  );
}
