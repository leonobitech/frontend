// components/scene/HoloHalo.tsx
"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export type Status = "open" | "connecting" | "closed";

type Props = {
  status: Status;
  onClick?: () => void;
};

export function HoloHalo({ status, onClick }: Props) {
  // Contenedor cuadrado y circular con utilidades **estándar** de Tailwind (v4 ok)
  return (
    <div className="w-96 h-96 rounded-full overflow-hidden bg-transparent relative">
      <Canvas
        className="!bg-transparent absolute inset-0"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <ParticleNebula status={status} onClick={onClick} />
      </Canvas>
    </div>
  );
}

/* -------------------------- Núcleo de partículas fiable -------------------------- */
function ParticleNebula({
  status,
  onClick,
}: {
  status: Status;
  onClick?: () => void;
}) {
  const pointsRef = useRef<THREE.Points>(null!);

  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));

  const COUNT = isMobile ? 2200 : 3600;
  const RADIUS = 1.2;
  const POINT_SIZE_WORLD = isMobile ? 0.028 : 0.034;

  // Textura circular para cada punto (sin imágenes externas)
  const circleTex = useMemo(() => {
    const size = 128;
    const cvs = document.createElement("canvas");
    cvs.width = cvs.height = size;
    const ctx = cvs.getContext("2d")!;
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    g.addColorStop(0.0, "rgba(255,255,255,1)");
    g.addColorStop(0.85, "rgba(255,255,255,0.45)");
    g.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, []);

  // Geometría (posiciones 3D con espesor) + semillas por partícula
  const { geometry, basePositions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = RADIUS * (0.65 + 0.35 * Math.random()); // espesor 65–100%
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry, basePositions: positions, seeds };
  }, [COUNT]);

  // Material nativo (estable) con blending aditivo y alpha
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: POINT_SIZE_WORLD,
      sizeAttenuation: true,
      map: circleTex,
      alphaMap: circleTex,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color(0x00eaff),
      opacity: 0.85,
    });
  }, [POINT_SIZE_WORLD, circleTex]);

  // Animación (pulsación ligera + rotación global) según status
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    const t = clock.getElapsedTime();
    const arr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    const stateK = status === "closed" ? 0 : status === "connecting" ? 1 : 2;
    const pulseAmp = 0.04 * (0.5 + 0.5 * stateK * 0.6);
    const pulseSpd = 0.9 + 0.4 * stateK;

    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const f = 1.0 + pulseAmp * Math.sin(t * pulseSpd + s * 6.28318);
      arr[i * 3 + 0] = basePositions[i * 3 + 0] * f;
      arr[i * 3 + 1] = basePositions[i * 3 + 1] * f;
      arr[i * 3 + 2] = basePositions[i * 3 + 2] * f;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    pointsRef.current.rotation.y = t * 0.12;
    pointsRef.current.rotation.x = Math.sin(t * 0.07) * 0.1;

    (pointsRef.current.material as THREE.PointsMaterial).opacity =
      THREE.MathUtils.lerp(0.35, 0.92, stateK / 2);
  });

  return (
    <points
      ref={pointsRef}
      args={[geometry, material]}
      onClick={useCallback(() => onClick?.(), [onClick])}
    />
  );
}
