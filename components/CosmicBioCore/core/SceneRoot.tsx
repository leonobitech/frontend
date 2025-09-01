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

// Baseline por estado — solo para los 3 uniforms que Sparks recibe desde uParams
const STATUS_BASE: Record<
  UIStatus,
  { pulseHz: number; splashPeriod: number; splashPower: number }
> = {
  connecting: { pulseHz: 0.8, splashPeriod: 3.6, splashPower: 0.16 },
  open: { pulseHz: 0.4, splashPeriod: 5.0, splashPower: 0.12 },
  closed: { pulseHz: 0.18, splashPeriod: 6.5, splashPower: 0.06 },
};

export function SceneRoot({
  status,
  quality,
  level, // 0..1 (RMS suavizado desde el mic)
}: {
  status: UIStatus;
  quality?: Quality;
  level: number;
}) {
  const { gl, scene, camera } = useThree();
  useSceneCleanup();

  const { sparks } = countsByQuality(quality);
  const { coreColor, accentColor } = useStatusParams(status);
  const base = STATUS_BASE[status];

  useEffect(() => {
    scene.background = null;
    camera.position.set(0, 0, 3.6);
    const r = gl as THREE.WebGLRenderer;
    r.setClearAlpha(0);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }, [gl, scene, camera]);

  // Factor de voz suave (puerta – evita ruido de ambiente)
  const voice = useMemo(() => smoothstep(0.08, 0.18, level), [level]);

  // Deltas aditivos que SÍ mueven la forma sin romper el look base
  const mods = useMemo(
    () => ({
      carpetWaveAmpAdd: lerp(0, 0.08, voice),
      carpetWaveHzAdd: lerp(0, 0.25, voice),
      // Extra opcional si querés:
      // gridBoostAdd:    lerp(0, 0.10, voice),
      // smokeOpacityAdd: lerp(0, 0.05, voice),
      // levAmpAdd:       lerp(0, 0.02, voice),
      // edgeLiftAmpAdd:  lerp(0, 0.02, voice),
    }),
    [voice]
  );

  // Params que consume Sparks. Si voice=0, mods=0 ⇒ nada cambia
  const uParams = useMemo(
    () => ({
      coreColor,
      accentColor,
      level,
      pulseHz: base.pulseHz,
      splashPeriod: base.splashPeriod,
      splashPower: base.splashPower,
      mods,
    }),
    [
      coreColor,
      accentColor,
      level,
      base.pulseHz,
      base.splashPeriod,
      base.splashPower,
      mods,
    ]
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
