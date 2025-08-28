"use client";
import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useSceneCleanup } from "./cleanupScene";
import { useStatusParams } from "./statusParams";
import { countsByQuality } from "./quality";
import { AuroraRibbon } from "./AuroraRibbon";
import { Sparks } from "./Sparks";
import type { UIStatus, Quality } from "../CosmicBioCore";

export function SceneRoot({
  status,
  quality,
  level,
}: {
  status: UIStatus;
  quality?: Quality;
  level: number;
}) {
  const { gl, scene, camera } = useThree();
  useSceneCleanup();

  const { ribbonL, ribbonW, sparks } = countsByQuality(quality);
  const { pulseHz, splashPeriod, splashPower, coreColor, accentColor } =
    useStatusParams(status);

  useEffect(() => {
    scene.background = null;
    camera.position.set(0, 0, 3.6);
    const r = gl as THREE.WebGLRenderer;
    r.setClearAlpha(0);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }, [gl, scene, camera]);

  const uParams = useMemo(
    () => ({
      pulseHz,
      splashPeriod,
      splashPower,
      coreColor,
      accentColor,
      level,
    }),
    [pulseHz, splashPeriod, splashPower, coreColor, accentColor, level]
  );

  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[2, 2, 3]} intensity={0.8} />
      <pointLight position={[-2, -2, -3]} intensity={0.4} />

      <AuroraRibbon L={ribbonL} W={ribbonW} uParams={uParams} />
      <Sparks count={sparks} uParams={uParams} />
    </>
  );
}
