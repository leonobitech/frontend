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
  radius?: number; // default 1.6
  /** Cantidad de anillos */
  rings?: number; // default 70
  /** Segmentos por anillo (resolución angular) */
  segments?: number; // default 180
  /** Color base metálico */
  baseColor?: THREE.ColorRepresentation; // default "#c6cbd3"
};

/** HSV → RGB (0..1) */
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
 * HoloHalo: anillos concéntricos (LineSegments) con onda radial y banda rainbow en la cresta.
 * - Diseño circular → sin bordes cortados.
 * - Sin shaders → robusto en todos los drivers.
 * - Modulado por `status`.
 */
export function HoloHalo({
  status,
  className,
  onClick,
  radius = 1.6,
  rings = 70,
  segments = 180,
  baseColor = "#c6cbd3",
}: HoloHaloProps) {
  return (
    <div className={className}>
      <div className="w-[320px] h-[320px] cursor-pointer" onClick={onClick}>
        <Canvas
          dpr={[1, 1.5]}
          // Cámara más lejos para que no recorte y se vea flotando
          camera={{ position: [0, 0, 4.2], fov: 40 }}
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

  // Creamos TODAS las líneas como un único LineSegments:
  // Para cada anillo, generamos segmentos consecutivos (theta -> theta+Δ)
  const { geometry, basePositions } = useMemo(() => {
    const perRingSegs = segments;
    const totalSegs = rings * perRingSegs;

    // 2 vértices por segmento, 3 coords por vértice
    const positions = new Float32Array(totalSegs * 2 * 3);
    const colors = new Float32Array(totalSegs * 2 * 3);
    // Guardamos la posición base (x,y) de cada vértice para recalcular z/colores
    const baseXY = new Float32Array(totalSegs * 2 * 2);
    const ringR: number[] = [];

    let p = 0; // index para positions/colors (stride 3)
    let xy = 0; // index para baseXY (stride 2)

    for (let rIndex = 0; rIndex < rings; rIndex++) {
      // radio del anillo (0..radius), con pequeño margen para no tocar borde
      const r = (radius - 0.02) * (rIndex / (rings - 1));
      ringR.push(r);

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

        // colores se rellenan en runtime
        p += 6;
        xy += 4;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return { geometry: geom, ringRadii: ringR, basePositions: baseXY };
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

  // Parámetros animados según estado (targets sencillos)
  const targets = useRef({
    amp: 0.3, // amplitud del ripple
    speed: 1.1, // velocidad de la onda
    freq: 5.5, // frecuencia radial
    rainbowWidth: 0.12, // ancho de la banda rainbow
    rainbowStrength: 0.9, // mezcla de color
    bowl: 0.12, // curvatura tipo "cuenco"
    spin: 0.05, // rotación global
  });

  useFrame((state, delta) => {
    if (!alive.current || !lineRef.current) return;

    // Targets por estado
    const t = state.clock.elapsedTime;
    if (status === "open") {
      targets.current.amp = 0.26;
      targets.current.speed = 1.0;
      targets.current.freq = 5.5;
      targets.current.rainbowWidth = 0.14;
      targets.current.rainbowStrength = 0.95;
      targets.current.bowl = 0.11;
      targets.current.spin = 0.04;
    } else if (status === "connecting") {
      targets.current.amp = 0.22 + Math.sin(t * 1.8) * 0.05;
      targets.current.speed = 1.6;
      targets.current.freq = 6.2;
      targets.current.rainbowWidth = 0.18;
      targets.current.rainbowStrength = 0.85;
      targets.current.bowl = 0.11;
      targets.current.spin = 0.08;
    } else {
      targets.current.amp = 0.08;
      targets.current.speed = 0.6;
      targets.current.freq = 5.0;
      targets.current.rainbowWidth = 0.08;
      targets.current.rainbowStrength = 0.25;
      targets.current.bowl = 0.1;
      targets.current.spin = 0.02;
    }

    const geom = lineRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geom.getAttribute("color") as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    const { amp, speed, freq, rainbowWidth, rainbowStrength, bowl, spin } =
      targets.current;

    // Recalcular z y color por VÉRTICE
    // Cada vértice tiene basePositions (x,y)
    const baseXY = basePositions;
    let p = 0; // index en positions/colors (stride 3)
    let xy = 0; // index en baseXY (stride 2)

    for (let v = 0; v < baseXY.length / 2; v++) {
      const x = baseXY[xy++];
      const y = baseXY[xy++];
      const r = Math.hypot(x, y);

      // Ripple radial + curvatura tipo bowl
      const wave = Math.sin(r * freq - t * speed);
      const z = wave * amp - bowl * r * r; // bowl suave

      positions[p + 2] = z;

      // Banda rainbow en la cresta (stress alto)
      const stress = Math.abs(wave);
      const c = 0.85;
      const w = rainbowWidth;
      const band =
        THREE.MathUtils.clamp((stress - (c - w)) / (w * 2), 0, 1) *
        THREE.MathUtils.clamp((c + w - stress) / (w * 2), 0, 1);

      // Hue animado por stress
      const hue = (0.6 + 0.25 * Math.sin(t * 0.35 + stress * Math.PI)) % 1.0;
      const [rr, gg, bb] = hsvToRgb(hue, 0.85, 1.0);

      // Mezcla con base metálica
      colors[p + 0] = THREE.MathUtils.lerp(
        baseCol.r,
        rr,
        band * rainbowStrength
      );
      colors[p + 1] = THREE.MathUtils.lerp(
        baseCol.g,
        gg,
        band * rainbowStrength
      );
      colors[p + 2] = THREE.MathUtils.lerp(
        baseCol.b,
        bb,
        band * rainbowStrength
      );

      p += 3;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Pose "levitando", sin garabato
    lineRef.current.rotation.x = THREE.MathUtils.degToRad(58);
    lineRef.current.rotation.z += delta * spin;
    const s = 1.0 + Math.sin(t * 0.7) * 0.01;
    lineRef.current.scale.set(s, s, 1);
  });

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />;
}
