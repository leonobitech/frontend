"use client";
import React, { useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneRoot, useMicLevel } from "./core";

export type UIStatus = "open" | "connecting" | "closed";
export type Quality = "low" | "med" | "high" | "ultra";

type Props = {
  status: UIStatus;
  onClick?: () => void;
  className?: string;
  quality?: Quality;
  useMic?: boolean;
  externalLevel?: number;
};

export function CosmicBioCore({
  status,
  onClick,
  className,
  quality = "med",
  useMic = false,
  externalLevel,
}: Props) {
  const handleClick = useCallback(() => onClick?.(), [onClick]);

  const internalMicLevel = useMicLevel(useMic);

  const fallbackLevel =
    status === "connecting" ? 0.6 : status === "open" ? 0.25 : 0.0;

  const level =
    typeof externalLevel === "number"
      ? externalLevel
      : useMic
      ? internalMicLevel
      : fallbackLevel;

  return (
    <button
      type="button"
      aria-label={status === "open" ? "Desconectar" : "Conectando"}
      onClick={handleClick}
      className={[
        "relative block",
        "w-[56vmin] h-[56vmin] max-w-[360px] max-h-[360px] min-w-[240px] min-h-[240px]",
        "appearance-none bg-transparent border-0 p-0 m-0",
        "outline-none focus:outline-none focus:ring-0 ring-0",
        className || "",
      ].join(" ")}
    >
      <Canvas
        className="absolute inset-0"
        dpr={[1, 2]}
        camera={{ fov: 15, position: [0, 0, 3.6] }}
        frameloop="always"
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <SceneRoot status={status} quality={quality} level={level} />
      </Canvas>
    </button>
  );
}
