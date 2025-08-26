"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type HoloHaloProps = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** Radio máximo de la cúpula */
  radius?: number; // default 1.9 (más grande)
  /** Cantidad de anillos */
  rings?: number; // default 90 (más definición)
  /** Segmentos por anillo (resolución angular) */
  segments?: number; // default 220
  /** Color base metálico */
  baseColor?: THREE.ColorRepresentation; // default "#c6cbd3"
};

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const m = i % 6;
  const r = [v, q, p, p, t, v][m];
  const g = [t, v, v, q, p, p][m];
  const b = [p, p, t, v, v, q][m];
  return [r, g, b];
}

/**
 * HoloHalo: anillos concéntricos con ripple radial, pulso y scan ring.
 * - Diseño circular (sin recortes).
 * - Sin shaders (LineSegments + vertex colors).
 * - Modulado por `status`.
 */
export function HoloHalo({
  status,
  className,
  onClick,
  radius = 1.9,
  rings = 90,
  segments = 220,
  baseColor = "#c6cbd3",
}: HoloHaloProps) {
  return (
    <div className={className}>
      {/* Canvas más amplio para que no recorte al animar */}
      <div
        className="w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] cursor-pointer"
        onClick={onClick}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 4.8], fov: 38 }} // más lejos y fov algo menor
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
          }}
        >
          <HaloLines
            status={status}
            radius={radius}
            rings={Math.max(8, Math.floor(rings))}
            segments={Math.max(24, Math.floor(segments))}
            baseColor={baseColor}
          />
        </Canvas>
      </div>
    </div>
  );
}

/* ------------------- Parte interna ------------------- */

type HaloLinesProps = {
  status: Status;
  radius: number;
  rings: number;
  segments: number;
  baseColor: THREE.ColorRepresentation;
};

function HaloLines({
  status,
  radius,
  rings,
  segments,
  baseColor,
}: HaloLinesProps) {
  const lineRef = useRef<THREE.LineSegments>(null!);
  const alive = useAlive();
  useSceneCleanup();

  // Geometría: anillos (segmentos consecutivos).
  const { geometry, baseXY } = useMemo(() => {
    const perRingSegs = segments;
    const totalSegs = rings * perRingSegs;

    const positions = new Float32Array(totalSegs * 2 * 3);
    const colors = new Float32Array(totalSegs * 2 * 3);
    const baseXY = new Float32Array(totalSegs * 2 * 2);

    let p = 0;
    let xy = 0;

    for (let rIndex = 0; rIndex < rings; rIndex++) {
      const r = (radius - 0.02) * (rIndex / (rings - 1));
      for (let s = 0; s < perRingSegs; s++) {
        const t1 = (s / perRingSegs) * Math.PI * 2;
        const t2 = ((s + 1) / perRingSegs) * Math.PI * 2;

        const x1 = r * Math.cos(t1);
        const y1 = r * Math.sin(t1);
        const x2 = r * Math.cos(t2);
        const y2 = r * Math.sin(t2);

        // v1
        positions[p + 0] = x1;
        positions[p + 1] = y1;
        positions[p + 2] = 0;
        baseXY[xy + 0] = x1;
        baseXY[xy + 1] = y1;

        // v2
        positions[p + 3] = x2;
        positions[p + 4] = y2;
        positions[p + 5] = 0;
        baseXY[xy + 2] = x2;
        baseXY[xy + 3] = y2;

        p += 6;
        xy += 4;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry: geom, baseXY };
  }, [radius, rings, segments]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
      }),
    []
  );

  const baseCol = useMemo(() => new THREE.Color(baseColor), [baseColor]);

  // Parámetros según estado
  const params = useRef({
    amp: 0.3, // amplitud del ripple
    speed: 1.1, // velocidad del ripple
    freq: 5.5, // frecuencia radial
    bowl: 0.1, // curvatura tipo cuenco
    spin: 0.05, // rotación global
    rainbowWidth: 0.2, // banda rainbow (más ancha)
    rainbowStrength: 1.0, // mezcla de color fuerte
    scanSpeed: 0.9, // velocidad del scan ring angular
    beatSpeed: 2.2, // latido global
    beatAmt: 0.08, // cuánto afecta el latido a la amplitud
  });

  useFrame((state, delta) => {
    if (!alive.current || !lineRef.current) return;

    const t = state.clock.elapsedTime;
    const p = params.current;

    // Modulación por estado
    if (status === "open") {
      p.amp = 0.28 + Math.sin(t * p.beatSpeed) * p.beatAmt; // latido
      p.speed = 1.0;
      p.freq = 5.4;
      p.spin = 0.04;
      p.rainbowWidth = 0.2;
      p.rainbowStrength = 1.0;
      p.scanSpeed = 1.0;
    } else if (status === "connecting") {
      p.amp = 0.22 + Math.sin(t * (p.beatSpeed * 1.2)) * (p.beatAmt * 1.2);
      p.speed = 1.6;
      p.freq = 6.2;
      p.spin = 0.08;
      p.rainbowWidth = 0.24;
      p.rainbowStrength = 0.95;
      p.scanSpeed = 1.6;
    } else {
      p.amp = 0.08 + Math.sin(t * (p.beatSpeed * 0.6)) * (p.beatAmt * 0.4);
      p.speed = 0.6;
      p.freq = 5.0;
      p.spin = 0.025;
      p.rainbowWidth = 0.12;
      p.rainbowStrength = 0.4;
      p.scanSpeed = 0.6;
    }

    const geom = lineRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geom.getAttribute("color") as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;
    const base = baseXY;

    let i = 0; // stride 3
    let j = 0; // stride 2

    for (let v = 0; v < base.length / 2; v++) {
      const x = base[j++];
      const y = base[j++];
      const r = Math.hypot(x, y);
      const theta = Math.atan2(y, x);

      // Ripple radial + bowl
      const wave = Math.sin(r * p.freq - t * p.speed);
      const z = wave * p.amp - p.bowl * r * r;
      positions[i + 2] = z;

      // Banda rainbow por stress + scan ring angular que recorre la cúpula
      const stress = Math.abs(wave);
      const c = 0.82;
      const w = p.rainbowWidth;
      const bandRadial =
        THREE.MathUtils.clamp((stress - (c - w)) / (w * 2), 0, 1) *
        THREE.MathUtils.clamp((c + w - stress) / (w * 2), 0, 1);

      const scan = 0.5 + 0.5 * Math.sin(theta * 3.0 + t * p.scanSpeed); // 3 lóbulos
      const band = THREE.MathUtils.clamp(bandRadial * (0.6 + 0.4 * scan), 0, 1);

      // Hue animado por stress + scan
      const hue =
        (0.58 + 0.25 * Math.sin(t * 0.4 + stress * Math.PI + scan)) % 1.0;
      const [rr, gg, bb] = hsvToRgb(hue, 0.9, 1.0);

      // Mezcla con base metálica (bien visible en dark)
      colors[i + 0] = THREE.MathUtils.lerp(
        baseCol.r,
        rr,
        band * p.rainbowStrength
      );
      colors[i + 1] = THREE.MathUtils.lerp(
        baseCol.g,
        gg,
        band * p.rainbowStrength
      );
      colors[i + 2] = THREE.MathUtils.lerp(
        baseCol.b,
        bb,
        band * p.rainbowStrength
      );

      i += 3;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Pose “levitando”
    lineRef.current.rotation.x = THREE.MathUtils.degToRad(57);
    lineRef.current.rotation.z += delta * p.spin;
    const scale = 1.0 + Math.sin(t * 0.7) * 0.01;
    lineRef.current.scale.set(scale, scale, 1);
  });

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />;
}
