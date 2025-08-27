// src/components/scene/HoloNet.tsx
"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type HoloNetProps = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** Diámetro del disco (ancho=alto) */
  size?: number; // default 4
  /** Densidad (divisiones por eje antes de recortar al círculo) */
  divisions?: number; // default 72
  /** Color base metálico */
  baseColor?: THREE.ColorRepresentation; // default "#b7bcc4"
};

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const r = [v, q, p, p, t, v][i % 6];
  const g = [t, v, v, q, p, p][i % 6];
  const b = [p, p, t, v, v, q][i % 6];
  return [r, g, b];
}

export function HoloNet({
  status,
  className,
  onClick,
  size = 4,
  divisions = 72,
  baseColor = "#b7bcc4",
}: HoloNetProps) {
  return (
    <div className={className}>
      <div className="w-[300px] h-[260px] cursor-pointer" onClick={onClick}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
          }}
        >
          <NetLines
            status={status}
            size={size}
            divisions={Math.max(8, Math.floor(divisions))}
            baseColor={baseColor}
          />
        </Canvas>
      </div>
    </div>
  );
}

/* ---------- Parte interna (líneas en disco + animación CPU) ---------- */

type NetLinesProps = {
  status: Status;
  size: number;
  divisions: number;
  baseColor: THREE.ColorRepresentation;
};

function NetLines({ status, size, divisions, baseColor }: NetLinesProps) {
  const lineRef = useRef<THREE.LineSegments>(null!);
  const alive = useAlive();
  useSceneCleanup();

  // Construimos una grilla y filtramos segmentos que caen FUERA de un círculo
  const { geometry, baseXY } = useMemo(() => {
    const half = size / 2;
    const radius = half * 0.98; // margen para que no “toque” el borde visual
    const N = divisions;
    const step = size / (N - 1);

    const pos: number[] = [];
    const base: number[] = [];

    const inside = (x: number, y: number) => x * x + y * y <= radius * radius;

    // Horizontales
    for (let j = 0; j < N; j++) {
      const y = -half + j * step;
      for (let i = 0; i < N - 1; i++) {
        const x1 = -half + i * step;
        const x2 = -half + (i + 1) * step;
        if (inside(x1, y) && inside(x2, y)) {
          pos.push(x1, y, 0, x2, y, 0);
          base.push(x1, y, x2, y);
        }
      }
    }

    // Verticales
    for (let i = 0; i < N; i++) {
      const x = -half + i * step;
      for (let j = 0; j < N - 1; j++) {
        const y1 = -half + j * step;
        const y2 = -half + (j + 1) * step;
        if (inside(x, y1) && inside(x, y2)) {
          pos.push(x, y1, 0, x, y2, 0);
          base.push(x, y1, x, y2);
        }
      }
    }

    const positions = new Float32Array(pos);
    const colors = new Float32Array(positions.length); // se rellena en runtime
    const baseXY = new Float32Array(base);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return { geometry: geom, baseXY };
  }, [size, divisions]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
      }),
    []
  );

  const targets = useRef({
    amp: 0.5,
    speed: 1.5,
    rainbowWidth: 0.12,
    rainbowStrength: 0.9,
    bend: 0.015,
  });

  const baseCol = useMemo(() => new THREE.Color(baseColor), [baseColor]);

  useFrame((state, delta) => {
    if (!alive.current || !lineRef.current) return;
    const geom = lineRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geom.getAttribute("color") as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    const t = state.clock.elapsedTime;

    // Objetivos por estado (suaves, sin “garabato”)
    if (status === "open") {
      targets.current.amp = 0.28;
      targets.current.speed = 1.0;
      targets.current.rainbowWidth = 0.12;
      targets.current.rainbowStrength = 0.9;
      targets.current.bend = 0.012;
    } else if (status === "connecting") {
      targets.current.amp = 0.22 + Math.sin(t * 1.4) * 0.05;
      targets.current.speed = 1.5;
      targets.current.rainbowWidth = 0.18;
      targets.current.rainbowStrength = 0.85;
      targets.current.bend = 0.012;
    } else {
      targets.current.amp = 0.08;
      targets.current.speed = 0.6;
      targets.current.rainbowWidth = 0.08;
      targets.current.rainbowStrength = 0.2;
      targets.current.bend = 0.012;
    }

    const amp = targets.current.amp;
    const freq = 6.0;
    const speed = targets.current.speed;
    const bend = targets.current.bend;
    const width = targets.current.rainbowWidth;
    const strength = targets.current.rainbowStrength;

    let p = 0;
    let xy = 0;
    const N = baseXY.length / 2;
    for (let v = 0; v < N; v++) {
      const x = baseXY[xy++];
      const y = baseXY[xy++];
      const r = Math.hypot(x, y);
      const wave = Math.sin(r * freq - t * speed);
      const z = wave * amp - bend * (x * x + y * y);

      positions[p + 2] = z;

      // stress y banda arcoíris
      const stress = Math.abs(wave);
      const center = 0.85;
      const bandA = THREE.MathUtils.clamp(
        (stress - (center - width)) / (width * 2),
        0,
        1
      );
      const bandB = THREE.MathUtils.clamp(
        (center + width - stress) / (width * 2),
        0,
        1
      );
      const band = bandA * bandB;

      const hue = (0.6 + 0.2 * Math.sin(t * 0.3 + stress * Math.PI)) % 1.0;
      const [rr, gg, bb] = hsvToRgb(hue, 0.8, 1.0);

      colors[p + 0] = THREE.MathUtils.lerp(baseCol.r, rr, band * strength);
      colors[p + 1] = THREE.MathUtils.lerp(baseCol.g, gg, band * strength);
      colors[p + 2] = THREE.MathUtils.lerp(baseCol.b, bb, band * strength);

      p += 3;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Posado/levitación: menos giro para evitar “garabato”
    lineRef.current.rotation.x = THREE.MathUtils.degToRad(60);
    lineRef.current.rotation.z += delta * 0.05; // lento
    const s = 1.0 + Math.sin(t * 0.7) * 0.01;
    lineRef.current.scale.set(s, s, 1);
  });

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />;
}
