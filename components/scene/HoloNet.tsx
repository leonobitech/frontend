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
  /** Tamaño del plano (ancho = alto) en unidades */
  size?: number; // default 4
  /** Cantidad de divisiones por eje (densidad de la malla) */
  divisions?: number; // default 60 (>= 8)
  /** Color base metálico del wireframe */
  baseColor?: THREE.ColorRepresentation; // default "#9aa0a6"
};

/** Util: HSV → RGB (0..1) */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const mod = i % 6;
  const r = [v, q, p, p, t, v][mod];
  const g = [t, v, v, q, p, p][mod];
  const b = [p, p, t, v, v, q][mod];
  return [r, g, b];
}

/**
 * Malla tipo “net” hecha con LineSegments (sin shaders custom).
 * - Onda animada sobre Z.
 * - Banda rainbow en la zona de mayor “stress”.
 * - onClick soportado (para disconnect).
 * - Sin descargas externas, TS estricto.
 */
export function HoloNet({
  status,
  className,
  onClick,
  size = 4,
  divisions = 60,
  baseColor = "#9aa0a6",
}: HoloNetProps) {
  return (
    <div className={className}>
      <div className="w-[260px] h-[260px] cursor-pointer" onClick={onClick}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5], fov: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
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

/* ---------- Parte interna (líneas + animación CPU) ---------- */

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

  // Pre-cálculo de geometría de líneas de una grilla (horizontal + vertical).
  // Cada segmento es (x,y,z) - (x2,y2,z2); inicial z=0, luego animamos.
  const { geometry, baseXY } = useMemo(() => {
    const half = size / 2;
    const N = divisions;
    const step = size / (N - 1);

    // Cantidad de segmentos:
    // - Horizontales: N filas * (N - 1) segmentos
    // - Verticales:   N columnas * (N - 1) segmentos
    const horizSegs = N * (N - 1);
    const vertSegs = N * (N - 1);
    const totalSegs = horizSegs + vertSegs;

    // Buffer para posiciones (dos vértices por segmento)
    const positions = new Float32Array(totalSegs * 2 * 3);
    // Guardamos X,Y base de cada vértice para recalcular Z y color por frame
    const baseXY: Float32Array = new Float32Array(totalSegs * 2 * 2);
    // Colores por vértice
    const colors = new Float32Array(totalSegs * 2 * 3);

    let idxP = 0;
    let idxXY = 0;

    // Horizontales: para cada fila y cada columna-1
    for (let j = 0; j < N; j++) {
      const y = -half + j * step;
      for (let i = 0; i < N - 1; i++) {
        const x1 = -half + i * step;
        const x2 = -half + (i + 1) * step;

        // v1
        positions[idxP++] = x1;
        positions[idxP++] = y;
        positions[idxP++] = 0;
        baseXY[idxXY++] = x1;
        baseXY[idxXY++] = y;
        // v2
        positions[idxP++] = x2;
        positions[idxP++] = y;
        positions[idxP++] = 0;
        baseXY[idxXY++] = x2;
        baseXY[idxXY++] = y;
      }
    }

    // Verticales: para cada columna y cada fila-1
    for (let i = 0; i < N; i++) {
      const x = -half + i * step;
      for (let j = 0; j < N - 1; j++) {
        const y1 = -half + j * step;
        const y2 = -half + (j + 1) * step;

        // v1
        positions[idxP++] = x;
        positions[idxP++] = y1;
        positions[idxP++] = 0;
        baseXY[idxXY++] = x;
        baseXY[idxXY++] = y1;
        // v2
        positions[idxP++] = x;
        positions[idxP++] = y2;
        positions[idxP++] = 0;
        baseXY[idxXY++] = x;
        baseXY[idxXY++] = y2;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry: geom, baseXY };
  }, [size, divisions]);

  // Material con colores por vértice habilitados
  const material = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 1, // browsers usualmente ignoran >1, pero no molesta
    });
    return mat;
  }, []);

  // Targets según estado para transiciones suaves
  const targets = useRef({
    amp: 0.35, // amplitud de onda
    freq: 6.0, // frecuencia radial
    speed: 1.2, // velocidad
    bend: 0.02, // curvatura base
    rainbowWidth: 0.12, // ancho banda arcoíris
    rainbowStrength: 1.0, // fuerza mezcla arcoíris
  });

  const baseCol = useMemo(() => new THREE.Color(baseColor), [baseColor]);

  useFrame((state, delta) => {
    if (!alive.current || !lineRef.current) return;
    const geom = lineRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geom.getAttribute("color") as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    // Objetivos por estado
    const t = state.clock.elapsedTime;
    if (status === "open") {
      targets.current.amp = 0.35;
      targets.current.speed = 1.2;
      targets.current.rainbowWidth = 0.12;
      targets.current.rainbowStrength = 1.0;
      targets.current.bend = 0.02;
    } else if (status === "connecting") {
      targets.current.amp = 0.25 + Math.sin(t * 1.5) * 0.08;
      targets.current.speed = 1.6;
      targets.current.rainbowWidth = 0.18;
      targets.current.rainbowStrength = 0.9;
      targets.current.bend = 0.02;
    } else {
      targets.current.amp = 0.1;
      targets.current.speed = 0.6;
      targets.current.rainbowWidth = 0.08;
      targets.current.rainbowStrength = 0.15;
      targets.current.bend = 0.02;
    }

    // Parámetros (con lerp suave)
    //const lerp = THREE.MathUtils.lerp;
    // Guardamos en locals para menos lookups
    const amp = targets.current.amp;
    const freq = 6.0; // fijo por ahora (puede exponerse)
    const speed = targets.current.speed;
    const bend = targets.current.bend;
    const width = targets.current.rainbowWidth;
    const strength = targets.current.rainbowStrength;

    // Recalcular Z y color por vértice
    let p = 0; // index positions
    let xy = 0; // index baseXY
    for (let v = 0; v < baseXY.length / 2; v++) {
      const x = baseXY[xy++];
      const y = baseXY[xy++];

      const r = Math.hypot(x, y);
      const wave = Math.sin(r * freq - t * speed);
      const z = wave * amp - bend * (x * x + y * y);

      positions[p + 2] = z; // set z (x,y están fijos)

      // stress y banda arcoíris
      const stress = Math.abs(wave);
      const center = 0.85;
      const band =
        THREE.MathUtils.clamp((stress - (center - width)) / (width * 2), 0, 1) *
        THREE.MathUtils.clamp((center + width - stress) / (width * 2), 0, 1);

      // Hue animado (0..1)
      const hue = (0.6 + 0.2 * Math.sin(t * 0.3 + stress * Math.PI)) % 1.0;
      const [rr, gg, bb] = hsvToRgb(hue, 0.8, 1.0);

      // Mezcla con base metálica
      const rMix = THREE.MathUtils.lerp(baseCol.r, rr, band * strength);
      const gMix = THREE.MathUtils.lerp(baseCol.g, gg, band * strength);
      const bMix = THREE.MathUtils.lerp(baseCol.b, bb, band * strength);

      colors[p + 0] = rMix;
      colors[p + 1] = gMix;
      colors[p + 2] = bMix;

      p += 3; // advance to next vertex (positions/colors stride = 3)
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Levitar/respirar global
    lineRef.current.rotation.x = THREE.MathUtils.degToRad(60);
    lineRef.current.rotation.z += delta * 0.15;
    const s = 1.0 + Math.sin(t * 0.8) * 0.015;
    lineRef.current.scale.set(s, s, 1);
  });

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />;
}
