"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type HoloFaceProps = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** Radio del “rostro” (óvalo) */
  radius?: number; // default 1.4
  rings?: number; // default 64 (anillos horizontales)
  segments?: number; // default 200 (resolución angular)
  baseColor?: THREE.ColorRepresentation; // default "#cfd3da"
};

/** Gaussiana 2D centrada en (cx, cy). */
function gauss(
  x: number,
  y: number,
  cx: number,
  cy: number,
  amp: number,
  sx: number,
  sy: number
) {
  const dx = (x - cx) / sx;
  const dy = (y - cy) / sy;
  return amp * Math.exp(-(dx * dx + dy * dy) * 0.5);
}

/** HSV → RGB (0..1) */
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

export function HoloFace({
  status,
  className,
  onClick,
  radius = 1.4,
  rings = 64,
  segments = 200,
  baseColor = "#cfd3da",
}: HoloFaceProps) {
  return (
    <div className={className}>
      {/* Canvas amplio y cámara lejos para evitar cortes */}
      <div
        className="w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] cursor-pointer"
        onClick={onClick}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5.6], fov: 36 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
          }}
        >
          <FaceLines
            status={status}
            radius={radius}
            rings={Math.max(8, Math.floor(rings))}
            segments={Math.max(48, Math.floor(segments))}
            baseColor={baseColor}
          />
        </Canvas>
      </div>
    </div>
  );
}

/* ---------------- parte interna ---------------- */

type FaceLinesProps = {
  status: Status;
  radius: number;
  rings: number;
  segments: number;
  baseColor: THREE.ColorRepresentation;
};

function FaceLines({
  status,
  radius,
  rings,
  segments,
  baseColor,
}: FaceLinesProps) {
  const ref = useRef<THREE.LineSegments>(null!);
  const alive = useAlive();
  useSceneCleanup();

  // Anillos concéntricos dentro de un óvalo suave (cara)
  const { geometry, baseXY } = useMemo(() => {
    const perRingSegs = segments;
    const totalSegs = rings * perRingSegs;

    const positions = new Float32Array(totalSegs * 2 * 3);
    const colors = new Float32Array(totalSegs * 2 * 3);
    const baseXY = new Float32Array(totalSegs * 2 * 2);

    let p = 0,
      xy = 0;

    for (let rIndex = 0; rIndex < rings; rIndex++) {
      // radio progresivo; comprimimos vertical para óvalo facial
      const rr = (radius - 0.02) * (rIndex / (rings - 1));
      for (let s = 0; s < perRingSegs; s++) {
        const t1 = (s / perRingSegs) * Math.PI * 2;
        const t2 = ((s + 1) / perRingSegs) * Math.PI * 2;

        // Óvalo: x=r*cos, y= (r*ky)*sin con ky<1
        const ky = 0.85; // quijada más sutil
        const x1 = rr * Math.cos(t1);
        const y1 = rr * ky * Math.sin(t1);
        const x2 = rr * Math.cos(t2);
        const y2 = rr * ky * Math.sin(t2);

        positions.set([x1, y1, 0, x2, y2, 0], p);
        baseXY.set([x1, y1, x2, y2], xy);

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

  // Parámetros: respiración, micro-gestos, color
  const params = useRef({
    amp: 0.22, // amplitud general de “volumen” facial
    speed: 0.8, // velocidad de anim
    spin: 0.02, // giro leve
    rainbowWidth: 0.18,
    rainbowStrength: 0.95,
    // “expresión” (sonrisa leve) y respiración
    smile: 0.15,
    breatheAmp: 0.06,
    breatheSpeed: 0.7,
  });

  useFrame((state, delta) => {
    if (!alive.current || !ref.current) return;

    const t = state.clock.elapsedTime;
    const p = params.current;

    // Modulación por estado
    if (status === "open") {
      p.amp = 0.22;
      p.speed = 0.8;
      p.spin = 0.02;
      p.rainbowStrength = 0.95;
    } else if (status === "connecting") {
      p.amp = 0.25;
      p.speed = 1.1;
      p.spin = 0.05;
      p.rainbowStrength = 0.9;
    } else {
      p.amp = 0.12;
      p.speed = 0.5;
      p.spin = 0.015;
      p.rainbowStrength = 0.6;
    }

    const geom = ref.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geom.getAttribute("color") as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;
    const base = baseXY;

    // Respiración (eleva/desciente levemente todo)
    const breathe = Math.sin(t * p.breatheSpeed) * p.breatheAmp;

    let i = 0,
      j = 0;
    for (let v = 0; v < base.length / 2; v++) {
      const x = base[j++]; // posición en plano
      const y = base[j++];

      // Campo de alturas facial: suma de gaussianas
      // Unidades normalizadas respecto al radio total
      const xn = x / radius;
      const yn = y / (radius * 0.85);

      // Nariz
      let z =
        gauss(xn, yn, 0.0, 0.15, 0.55, 0.16, 0.22) + // puente
        gauss(xn, yn, 0.0, -0.05, 0.45, 0.18, 0.2); // punta

      // Pómulos
      z += gauss(xn, yn, -0.35, 0.05, 0.32, 0.28, 0.2);
      z += gauss(xn, yn, 0.35, 0.05, 0.32, 0.28, 0.2);

      // Cejas / frente
      z += gauss(xn, yn, -0.25, 0.45, 0.18, 0.35, 0.18);
      z += gauss(xn, yn, 0.25, 0.45, 0.18, 0.35, 0.18);

      // Mentón
      z += gauss(xn, yn, 0.0, -0.6, 0.22, 0.28, 0.18);

      // Boca (sonrisa suave controlada)
      const smile = p.smile * 0.6;
      z -=
        gauss(xn, yn, 0.0, -0.28, 0.2, 0.45, 0.18) *
        (1.0 - Math.abs(xn)) *
        (1.0 + smile);

      // Suavidad general y respiración/latido
      z = Math.max(0, z * p.amp + breathe);

      positions[i + 2] = z; // set z

      // Colores: resalta crestas (derivada aproximada por altura) con arcoíris
      const stress = THREE.MathUtils.clamp(
        z / (p.amp + p.breatheAmp + 1e-5),
        0,
        1
      );
      const center = 0.75,
        w = params.current.rainbowWidth;
      const band =
        THREE.MathUtils.clamp((stress - (center - w)) / (w * 2), 0, 1) *
        THREE.MathUtils.clamp((center + w - stress) / (w * 2), 0, 1);

      const hue = (0.58 + 0.22 * Math.sin(t * 0.4 + stress * Math.PI)) % 1.0;
      const [rr, gg, bb] = hsvToRgb(hue, 0.9, 1.0);

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

    // Pose flotando
    ref.current.rotation.x = THREE.MathUtils.degToRad(50);
    ref.current.rotation.z += delta * p.spin;
  });

  return <lineSegments ref={ref} geometry={geometry} material={material} />;
}
