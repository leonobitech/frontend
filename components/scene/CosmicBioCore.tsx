// components/scene/CosmicBioCore.tsx
"use client";

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export type UIStatus = "open" | "connecting" | "closed";

type Props = {
  status: UIStatus;
  onClick?: () => void;
  className?: string; // agrega utilidades Tailwind si querés
};

// Config internas (sin props externas)
const DEFAULT_PARTICLE_COUNT = 4200; // densidad
const DEFAULT_SIZE_CLASS = "w-[360px] h-[360px]"; // tamaño fijo (sin inline)

// ===== PRNG determinista
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ===== driver discreto por estado
function useStatusDriver(status: UIStatus) {
  const ref = useRef(0);
  useEffect(() => {
    ref.current = status === "closed" ? 0 : status === "connecting" ? 1 : 2;
  }, [status]);
  return ref; // 0/1/2
}

// ===== sprite circular suave
function makeCircleSpriteTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  const r = size / 2;
  const grd = ctx.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0.0, "rgba(255,255,255,1.0)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grd.addColorStop(1.0, "rgba(255,255,255,0.0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.anisotropy = 4;
  return tex;
}

// ===== nube de partículas (halo)
function HaloPoints({ status }: { status: UIStatus }) {
  const pointsRef = useRef<
    THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>
  >(null!);
  const driver = useStatusDriver(status);

  const positions = useMemo(() => {
    const count = Math.max(100, Math.floor(DEFAULT_PARTICLE_COUNT));
    const pos = new Float32Array(count * 3);
    const rnd = mulberry32(42);

    // Distribución tipo Fibonacci sphere (cascarón esférico con jitter leve)
    const inc = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count; // evita saturación en polos
      const y = 1 - 2 * t; // 1..-1
      const r = Math.sqrt(1 - y * y);
      const phi = i * inc;
      const radius = 1.0 + (rnd() - 0.5) * 0.06; // ±3%
      const x = Math.cos(phi) * r * radius;
      const z = Math.sin(phi) * r * radius;
      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y * radius;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  const spriteTex = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return makeCircleSpriteTexture(128);
  }, []);

  useFrame((state, delta) => {
    const p = pointsRef.current;
    if (!p) return;

    const k = driver.current; // 0/1/2
    const rot = k === 0 ? 0.04 : k === 1 ? 0.32 : 0.14;
    const breatheSpeed = k === 1 ? 2.7 : 1.5;
    const breatheAmp = k === 1 ? 0.11 : 0.06;

    p.rotation.y += rot * delta;

    // Pulsación global sin cambiar size del punto
    const t = state.clock.elapsedTime;
    const scale = 1.0 + Math.sin(t * breatheSpeed) * breatheAmp;
    p.scale.setScalar(scale);

    // Fundido por estado
    const mat = p.material as THREE.PointsMaterial;
    const targetOpacity = k === 0 ? 0.0 : k === 1 ? 0.9 : 0.55;
    mat.opacity += (targetOpacity - mat.opacity) * Math.min(1, delta * 6);
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        {/* R3F moderno: usa args en bufferAttribute */}
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={spriteTex}
        size={0.024}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.0}
        color={new THREE.Color(0xffffff)}
      />
    </points>
  );
}

// ===== glow central
function CoreGlow({ status }: { status: UIStatus }) {
  const meshRef = useRef<
    THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshBasicMaterial>
  >(null!);
  const driver = useStatusDriver(status);

  useFrame((_, delta) => {
    const k = driver.current;
    const m = meshRef.current;
    if (!m) return;
    const target = k === 0 ? 0.0 : k === 1 ? 1.0 : 0.6;
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.opacity += (target - mat.opacity) * Math.min(1, delta * 4);
    m.rotation.y += 0.15 * delta;
    m.rotation.x += 0.08 * delta;
  });

  return (
    <mesh ref={meshRef} scale={0.25}>
      <icosahedronGeometry args={[1, 3]} />
      <meshBasicMaterial
        transparent
        blending={THREE.AdditiveBlending}
        color={new THREE.Color(0x88ccff)}
        opacity={0.0}
      />
    </mesh>
  );
}

export function CosmicBioCore({ status, onClick, className }: Props) {
  return (
    <div
      className={[
        "cbcore",
        DEFAULT_SIZE_CLASS,
        "relative",
        className ?? "",
      ].join(" ")}
      onClick={onClick}
      role="button"
      aria-label="CosmicBioCore"
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ fov: 45, position: [0, 0, 3.6] }}
      >
        <group>
          <HaloPoints status={status} />
          <CoreGlow status={status} />
        </group>
      </Canvas>
    </div>
  );
}
