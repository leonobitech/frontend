"use client";
import React, { useCallback, useMemo } from "react";
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
  quality = "ultra",
  useMic = false,
  externalLevel,
}: Props) {
  const handleClick = useCallback(() => onClick?.(), [onClick]);

  const internalMicLevel = useMicLevel(useMic);

  const fallbackLevel =
    status === "connecting" ? 0.6 : status === "open" ? 0.25 : 0.0;

  const rawLevel =
    typeof externalLevel === "number"
      ? externalLevel
      : useMic
      ? internalMicLevel
      : fallbackLevel;

  // Seguridad: clamp 0..1 (no cambia el look si ya venía bien)
  const level = useMemo(() => {
    const v = Number.isFinite(rawLevel as number) ? (rawLevel as number) : 0;
    return Math.max(0, Math.min(1, v));
  }, [rawLevel]);

  // Solo corregimos el label (antes no decía "Conectar" en closed)
  const ariaLabel = useMemo(() => {
    if (status === "open") return "Desconectar";
    if (status === "connecting") return "Conectando";
    return "Conectar";
  }, [status]);

  // Optional: baja GPU cuando está cerrado; no toca la lógica del WS
  const frameLoop = status === "closed" ? "demand" : "always";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleClick}
      data-status={status}
      className={[
        "relative block mx-auto",
        // Área efectiva: más grande manteniendo proporción
        "w-full max-w-[94vw] xs:max-w-[520px] sm:max-w-[680px] md:max-w-[920px] lg:max-w-[1120px]",
        // Proporción: un poco más alta en mobile, más panorámica en desktop
        "aspect-[16/11] xs:aspect-[5/3] sm:aspect-[16/9] lg:aspect-[21/9]",
        // Altura mínima suave para que no colapse en layouts apretados
        "min-h-[220px] sm:min-h-[260px]",
        // Reset de estilos del “botón” contenedor
        "appearance-none bg-transparent border-0 p-0 m-0",
        "outline-none focus:outline-none focus:ring-0 ring-0",
        className || "",
      ].join(" ")}
    >
      <Canvas
        className="absolute inset-0"
        dpr={[1, 2]}
        camera={{ fov: 20, position: [0, 0, 3.6] }}
        frameloop={frameLoop}
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
