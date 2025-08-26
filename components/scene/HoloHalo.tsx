"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type HoloPortalProps = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** radio del portal (mundo) */
  radius?: number; // default 1.6
  /** cantidad de anillos */
  rings?: number; // default 14
  /** segmentos por anillo */
  segments?: number; // default 180
};

export function HoloHalo({
  status,
  className,
  onClick,
  radius = 1.6,
  rings = 14,
  segments = 180,
}: HoloPortalProps) {
  return (
    <div className={className}>
      {/* contenedor más grande para que no se corte al animar */}
      <div
        className="w-[380px] h-[380px] sm:w-[440px] sm:h-[440px] cursor-pointer bg-black rounded-xl"
        onClick={onClick}
        style={{ boxShadow: "0 0 40px rgba(0, 238, 255, 0.06) inset" }}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5.2], fov: 36 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <color attach="background" args={["#000000"]} />
          <ambientLight intensity={0.4} />
          <PortalRings
            status={status}
            radius={radius}
            rings={rings}
            segments={segments}
          />
          <SparkField />
        </Canvas>
      </div>
    </div>
  );
}

/* -------------------- RINGS -------------------- */

function PortalRings({
  status,
  radius,
  rings,
  segments,
}: {
  status: Status;
  radius: number;
  rings: number;
  segments: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const alive = useAlive();
  useSceneCleanup();

  const ringGeometries = useMemo(() => {
    // generamos aritos como LineLoop (cada uno con su geometría)
    const geoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < rings; i++) {
      const r = radius * (0.35 + 0.05 * i); // distancia progresiva
      const pos = new Float32Array(segments * 3);
      for (let s = 0; s < segments; s++) {
        const t = (s / segments) * Math.PI * 2;
        pos[s * 3 + 0] = Math.cos(t) * r;
        pos[s * 3 + 1] = Math.sin(t) * r;
        pos[s * 3 + 2] = 0;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geoms.push(g);
    }
    return geoms;
  }, [radius, rings, segments]);

  const materials = useMemo(() => {
    // tonos cian/azules
    return Array.from({ length: rings }, (_, i) => {
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(0.52 + i * 0.02, 1, 0.52),
        transparent: true,
        opacity: 0.85,
      });
      return mat;
    });
  }, [rings]);

  useFrame((state, delta) => {
    if (!alive.current || !groupRef.current) return;

    const t = state.clock.getElapsedTime();

    // parámetros por estado
    const spinBase =
      status === "connecting" ? 0.35 : status === "open" ? 0.18 : 0.08;
    const wobble =
      status === "connecting" ? 0.06 : status === "open" ? 0.04 : 0.02;
    const pulse =
      0.85 + 0.15 * Math.sin(t * (status === "connecting" ? 2.0 : 1.2));

    groupRef.current.rotation.x = THREE.MathUtils.degToRad(62);
    groupRef.current.rotation.z += delta * spinBase;

    // levitación sutil
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.05;

    // actualizar opacidades con pulso y “scan” radial
    const children = groupRef.current.children as THREE.Line[];
    for (let i = 0; i < children.length; i++) {
      const line = children[i];
      const mat = line.material as THREE.LineBasicMaterial;

      // vibración de cada anillo (ligera)
      line.rotation.z += Math.sin(t * 0.8 + i) * wobble * 0.002;

      // opacidad dinámica
      const ringPhase = Math.sin(t * 0.8 + i * 0.6) * 0.5 + 0.5; // 0..1
      const baseOpacity = status === "closed" ? 0.45 : 0.65 + 0.35 * ringPhase;
      mat.opacity = baseOpacity * pulse;

      // color reactivo en "connecting"
      if (status === "connecting") {
        const hue = (0.55 + 0.25 * Math.sin(t * 0.4 + i * 0.2)) % 1.0;
        mat.color.setHSL(hue, 1, 0.55);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {ringGeometries.map((g, i) => (
        <lineLoop key={i} geometry={g} material={materials[i]} />
      ))}
      {/* scan ring luminoso */}
      <ScanRing
        status={status}
        radius={radius * (0.35 + 0.05 * (rings - 1))}
        segments={segments}
      />
    </group>
  );
}

function ScanRing({
  status,
  radius,
  segments,
}: {
  status: Status;
  radius: number;
  segments: number;
}) {
  const ref = useRef<THREE.LineLoop>(null!);
  const alive = useAlive();

  const geom = useMemo(() => {
    const pos = new Float32Array(segments * 3);
    for (let s = 0; s < segments; s++) {
      const t = (s / segments) * Math.PI * 2;
      pos[s * 3 + 0] = Math.cos(t) * radius;
      pos[s * 3 + 1] = Math.sin(t) * radius;
      pos[s * 3 + 2] = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [radius, segments]);

  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#00eaff"),
        transparent: true,
        opacity: 0.0,
      }),
    []
  );

  useFrame((state) => {
    if (!alive.current || !ref.current) return;
    const t = state.clock.getElapsedTime();

    // el scan aparece más en "connecting"
    const target =
      status === "connecting" ? 0.95 : status === "open" ? 0.5 : 0.0;
    const k = 0.1;
    mat.opacity += (target - mat.opacity) * k;

    // barrido angular
    ref.current.rotation.z = t * (status === "connecting" ? 1.2 : 0.6);
  });

  return <lineLoop ref={ref} geometry={geom} material={mat} />;
}

/* -------------------- SPARKS -------------------- */

function SparkField() {
  const ref = useRef<THREE.Points>(null!);
  const alive = useAlive();

  const { geometry, material } = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // distribuye en disco amplio y atrás
      const r = 3.5 * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      pos[i * 3 + 0] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = -Math.random() * 1.5 - 0.4; // hacia el fondo
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      size: 0.015,
      color: new THREE.Color("#00eaff"),
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    return { geometry: g, material: m };
  }, []);

  useFrame(({ clock }) => {
    if (!alive.current || !ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.z = t * 0.02;
    (ref.current.material as THREE.PointsMaterial).opacity =
      0.25 + 0.1 * Math.sin(t * 0.8);
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}
