"use client";
import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useSceneCleanup } from "./cleanupScene";
import { useStatusParams } from "./statusParams";
import { countsByQuality } from "./quality";
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

  const { sparks } = countsByQuality(quality);
  const { coreColor, accentColor } = useStatusParams(status);

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
      coreColor,
      accentColor,
      level,
      pulseHz: 1, // Set appropriate default or computed value
      splashPeriod: 1, // Set appropriate default or computed value
      splashPower: 1, // Set appropriate default or computed value
    }),
    [coreColor, accentColor, level]
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
