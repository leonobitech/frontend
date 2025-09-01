"use client";
import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useSceneCleanup } from "./cleanupScene";
import { useStatusParams } from "./statusParams";
import { countsByQuality } from "./quality";
import { Sparks } from "./Sparks";
import type { UIStatus, Quality } from "../CosmicBioCore";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function SceneRoot({
  status,
  quality,
  level,
}: {
  status: UIStatus;
  quality?: Quality;
  level: number; // 0..1 (RMS suavizado)
}) {
  const { gl, scene, camera } = useThree();
  useSceneCleanup();

  const { sparks } = countsByQuality(quality);
  const { coreColor, accentColor, base } = useStatusParams(status);

  useEffect(() => {
    scene.background = null;
    camera.position.set(0, 0, 3.6);
    const r = gl as THREE.WebGLRenderer;
    r.setClearAlpha(0);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }, [gl, scene, camera]);

  // Voz: puerta suave para evitar ruido de ambiente
  const voice = useMemo(() => smoothstep(0.08, 0.18, level), [level]);

  // Solo los parámetros que Sparks tipa y consume hoy
  const uParams = useMemo(
    () => ({
      coreColor,
      accentColor,
      level,
      // Dinámica por estado + refuerzo por voz
      pulseHz: lerp(base.pulseHz, base.pulseHz + 0.35, voice),
      splashPeriod: lerp(
        base.splashPeriod,
        Math.max(2.8, base.splashPeriod - 1.2),
        voice
      ),
      splashPower: lerp(base.splashPower, base.splashPower + 0.12, voice),
    }),
    [coreColor, accentColor, level, base, voice]
  );

  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[2, 2, 3]} intensity={0.8} />
      <pointLight position={[-2, -2, -3]} intensity={0.4} />
      <Sparks count={sparks} uParams={uParams} />
    </>
  );
}
