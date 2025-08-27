"use client";

import React, { useEffect, useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

/* ------------------------- Tipos ------------------------- */
export type UIStatus = "open" | "connecting" | "closed";

type Props = {
  status: UIStatus;
  onClick?: () => void;
};

/* ---------------------- Utils internas ---------------------- */
function useAnimFactor(status: UIStatus) {
  const factor = useRef(0.0);
  useEffect(() => {
    factor.current =
      status === "connecting" ? 1.0 : status === "open" ? 0.5 : 0.1;
  }, [status]);
  return factor;
}

function useStatusColor(status: UIStatus) {
  return useMemo(() => {
    if (status === "connecting") return new THREE.Color("#f59e0b"); // ámbar
    if (status === "open") return new THREE.Color("#22d3ee"); // cian
    return new THREE.Color("#94a3b8"); // gris fallback
  }, [status]);
}

/* ---------------------- Partículas Halo ---------------------- */
function HaloParticles({ status }: { status: UIStatus }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1400;

  // Genera posiciones para partículas distribuidas en anillos
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const rings = [0.8, 1.2, 1.5];
    for (let i = 0; i < count; i++) {
      const ring = rings[i % rings.length];
      const a = (i / count) * Math.PI * 6 + Math.random() * 0.3;
      const r = ring + (Math.random() - 0.5) * 0.05;
      const x = Math.cos(a) * r;
      const y = (Math.random() - 0.5) * 0.15;
      const z = Math.sin(a) * r;
      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    return arr;
  }, [count]);

  const color = useStatusColor(status);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.02,
        sizeAttenuation: true,
        color,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [color]
  );

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const animFactor = useAnimFactor(status);
  const alive = useAlive();

  useFrame((state, delta) => {
    if (!alive.current) return;
    const p = pointsRef.current;
    if (!p) return;
    p.rotation.y += delta * (0.1 + 0.2 * animFactor.current);
    p.rotation.x += delta * 0.03;
    const t = state.clock.elapsedTime;
    const amp = 0.35 + 0.35 * Math.sin(t * (1.5 + animFactor.current));
    const mat = p.material as THREE.PointsMaterial;
    mat.opacity = 0.6 + amp * 0.25;
    mat.size = 0.016 + amp * 0.012;
  });

  // Limpieza manual de geometría y material
  useEffect(() => {
    return () => {
      geom.dispose();
      material.dispose();
    };
  }, [geom, material]);

  return <points ref={pointsRef} geometry={geom} material={material} />;
}

/* ---------------------- Núcleo Orbe ---------------------- */
function CoreOrb({ status }: { status: UIStatus }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useStatusColor(status);
  const animFactor = useAnimFactor(status);
  const alive = useAlive();

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.6,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95,
        emissive: color.clone().multiplyScalar(0.15),
        emissiveIntensity: 0.8,
      }),
    [color]
  );

  useFrame((state, delta) => {
    if (!alive.current) return;
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const pulsate = 1.0 + 0.04 * Math.sin(t * (2.0 + animFactor.current));
    mesh.scale.setScalar(pulsate);
    mesh.rotation.y += delta * 0.25;
  });

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.55, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/* ---------------------- Escena principal ---------------------- */
function SceneRoot({ status }: { status: UIStatus }) {
  const { gl, scene, camera } = useThree();

  // Limpieza global al desmontar la escena
  useSceneCleanup();

  useEffect(() => {
    // Fondo transparente real
    scene.background = null;

    camera.position.set(0, 0, 3.6);
    const renderer = gl as THREE.WebGLRenderer;
    renderer.setClearAlpha(0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, [gl, scene, camera]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[2.5, 2.5, 2.5]} intensity={1.2} />
      <pointLight position={[-2, -1.5, -2]} intensity={0.7} />
      <CoreOrb status={status} />
      <HaloParticles status={status} />
    </>
  );
}

/* ---------------------- Componente público ---------------------- */
export function CosmicBioCore({ status, onClick }: Props) {
  const handleClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  return (
    <button
      type="button"
      aria-label={status === "open" ? "Desconectar" : "Conectando"}
      onClick={handleClick}
      className={[
        "relative block",
        "w-[56vmin] h-[56vmin]",
        "max-w-[360px] max-h-[360px]",
        "min-w-[240px] min-h-[240px]",
        "rounded-2xl ring-1 ring-white/10 backdrop-blur-[1px]",
        "transition-transform duration-300 hover:scale-[1.02] active:scale-[0.99]",
      ].join(" ")}
    >
      <Canvas
        className="absolute inset-0"
        dpr={[1, 2]}
        camera={{ fov: 45, position: [0, 0, 3.6] }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <SceneRoot status={status} />
      </Canvas>

      {/* Halo externo suave */}
      <span
        className={[
          "pointer-events-none absolute inset-0 rounded-2xl",
          "ring-1 ring-cyan-300/10",
          status === "connecting" ? "animate-pulse" : "",
        ].join(" ")}
      />
    </button>
  );
}
