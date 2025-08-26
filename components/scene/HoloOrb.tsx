"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  MeshTransmissionMaterial,
  Lightformer,
} from "@react-three/drei";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

type Status = "open" | "connecting" | "closed";
type Shape =
  | "icosahedron"
  | "torusKnot"
  | "torus"
  | "dodecahedron"
  | "octahedron"
  | "capsule"
  | "cone";

const supportsTransmission = typeof MeshTransmissionMaterial === "function";

/** Pequeño factory de geometrías (todas memoizadas). */
function useShapeGeometry(shape: Shape) {
  return useMemo(() => {
    switch (shape) {
      case "torusKnot":
        return new THREE.TorusKnotGeometry(0.85, 0.26, 256, 48);
      case "torus":
        return new THREE.TorusGeometry(0.95, 0.28, 48, 256);
      case "dodecahedron":
        return new THREE.DodecahedronGeometry(1, 0);
      case "octahedron":
        return new THREE.OctahedronGeometry(1, 0);
      case "capsule":
        return new THREE.CapsuleGeometry(0.7, 0.6, 16, 48);
      case "cone":
        return new THREE.ConeGeometry(0.9, 1.6, 64, 1, false);
      case "icosahedron":
      default:
        return new THREE.IcosahedronGeometry(1, 4);
    }
  }, [shape]);
}

function OrbMesh({ status, shape }: { status: Status; shape: Shape }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const alive = useAlive();
  useSceneCleanup();

  const geometry = useShapeGeometry(shape);

  const fallbackMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        transmission: 0.95,
        roughness: 0.25,
        thickness: 0.5,
        envMapIntensity: 1,
        metalness: 0,
        clearcoat: 1,
        transparent: true,
      }),
    []
  );

  const glowColor =
    status === "open"
      ? "#4ade80"
      : status === "connecting"
      ? "#60a5fa"
      : "#94a3b8";

  const targetScale =
    status === "open" ? 1.1 : status === "connecting" ? 1.05 : 0.95;

  useFrame((_state, dt) => {
    if (!alive.current || !meshRef.current) return;
    const m = meshRef.current;
    const next = THREE.MathUtils.lerp(m.scale.x, targetScale, dt * 4);
    m.scale.setScalar(next);
    if (status === "open" || status === "connecting") {
      m.rotation.y += dt * 0.4;
      m.rotation.x += dt * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      {supportsTransmission ? (
        <MeshTransmissionMaterial
          transmission={0.95}
          roughness={0.25}
          thickness={0.5}
          ior={1.2}
          samples={8}
          resolution={128}
          chromaticAberration={0}
          distortion={0}
          anisotropy={0}
          temporalDistortion={0}
          toneMapped
          attenuationColor={glowColor}
        />
      ) : (
        <primitive object={fallbackMaterial} attach="material" />
      )}
    </mesh>
  );
}

export function HoloOrb({
  status,
  className,
  onClick,
  shape = "icosahedron",
}: {
  status: Status;
  className?: string;
  onClick?: () => void;
  shape?: Shape; // <- NUEVO
}) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className || ""}`}>
      <div className="w-[220px] h-[220px] cursor-pointer" onClick={onClick}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 3.2], fov: 45 }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
          }}
        >
          {/* Luces ligeras */}
          <ambientLight intensity={0.35} />
          <directionalLight position={[2, 3, 4]} intensity={0.6} />

          {/* Environment LOCAL (CSP-safe) */}
          <Environment resolution={64} frames={1} background={false}>
            <Lightformer
              form="ring"
              intensity={2.2}
              color="#ffffff"
              scale={[2.5, 2.5, 1]}
              position={[0, 0, 2]}
            />
            <Lightformer
              intensity={1.2}
              color="#9ec5ff"
              scale={[4, 1, 1]}
              position={[2, 1, -2]}
              rotation={[0, -Math.PI / 4, 0]}
            />
            <Lightformer
              intensity={1.0}
              color="#ffd1d1"
              scale={[4, 1, 1]}
              position={[-2, -1, -2]}
              rotation={[0, Math.PI / 4, 0]}
            />
            <Lightformer
              intensity={0.6}
              color="#ffffff"
              scale={[2, 0.5, 1]}
              position={[0, 2, -3]}
            />
          </Environment>

          <OrbMesh status={status} shape={shape} />
        </Canvas>
      </div>

      {/* Label debajo */}
      {status === "open" && (
        <span className="text-green-500 text-sm font-medium tracking-wide">
          Connected
        </span>
      )}
      {status === "connecting" && (
        <span className="text-indigo-400 text-sm font-medium tracking-wide animate-pulse">
          Connecting…
        </span>
      )}
    </div>
  );
}
