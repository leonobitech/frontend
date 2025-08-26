"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three"; // ← IMPORTANTE: namespace THREE
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial } from "@react-three/drei";

type Status = "open" | "connecting" | "closed";

interface HoloOrbProps {
  status: Status;
  onClick?: () => void;
  className?: string;
  quality?: "low" | "med" | "high";
}

function OrbMesh({
  status,
  onClick,
}: {
  status: Status;
  onClick?: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null!);

  const targetScale = useMemo(() => {
    if (status === "open") return 1.06;
    if (status === "connecting") return 1.03;
    return 1.0;
  }, [status]);

  useFrame((_, dt) => {
    if (ref.current) {
      const s = ref.current.scale.x;
      const next = s + (targetScale - s) * Math.min(1, dt * 4);
      ref.current.scale.setScalar(next);
      ref.current.rotation.y +=
        dt * (status === "open" ? 0.25 : status === "connecting" ? 0.12 : 0.06);
      ref.current.rotation.x += dt * 0.03;
    }
  });

  return (
    <mesh
      ref={ref}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <sphereGeometry args={[1, 128, 128]} />
      <MeshTransmissionMaterial
        color="#ffffff"
        thickness={0.6}
        roughness={0.2}
        transmission={1}
        ior={1.3}
        chromaticAberration={0.08}
        anisotropy={0.1}
        distortion={0.08}
        distortionScale={0.2}
        temporalDistortion={0.05}
        attenuationColor="#a2b6ff"
        attenuationDistance={0.9}
        samples={8}
        resolution={512}
        backside
      />
    </mesh>
  );
}

export function HoloOrb({
  status,
  onClick,
  className = "",
  quality = "med",
}: HoloOrbProps) {
  const dpr: [number, number] =
    quality === "high" ? [1, 2] : quality === "low" ? [1, 1.5] : [1, 1.75];

  return (
    <div
      className={[
        // capa absoluta centrada, canvas transparente
        "absolute inset-0 grid place-items-center z-[12] pointer-events-auto",
        className,
      ].join(" ")}
    >
      {/* contenedor cuadrado responsivo con Tailwind (arbitrary values) */}
      <div className="w-[min(72vmin,520px)] h-[min(72vmin,520px)]">
        <Canvas
          dpr={dpr}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl, scene }) => {
            gl.setClearAlpha(0); // fondo 100% transparente
            scene.background = null;
          }}
          frameloop="always"
        >
          {/* Luces suaves para light/dark */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 5, 2]} intensity={0.7} />
          <directionalLight position={[-4, -2, -3]} intensity={0.3} />

          {/* Reflejos de entorno */}
          <Environment preset="city" blur={0.6} />

          <group scale={1}>
            <OrbMesh status={status} onClick={onClick} />
          </group>
        </Canvas>
      </div>
    </div>
  );
}
