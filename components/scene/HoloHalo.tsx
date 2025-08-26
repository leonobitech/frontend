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
  /** Cantidad de anillos visibles */
  rings?: number; // default 56
  /** Segmentos por anillo (resolución angular) */
  segments?: number; // default 200
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
 * HoloHalo (Dome con centro móvil en Y):
 * - Cúpula de anillos concéntricos.
 * - Ripple corto y atenuado hacia el borde.
 * - El CENTRO del campo se desplaza en Y (yCenter) → crea rizado interno dinámico.
 * - Sin shaders (LineSegments + vertex colors). TS estricto.
 */
export function HoloHalo({
  status,
  className,
  onClick,
  radius = 1.6,
  rings = 56,
  segments = 200,
  baseColor = "#c6cbd3",
}: HoloHaloProps) {
  return (
    <div className={className}>
      <div
        className="w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] cursor-pointer"
        onClick={onClick}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5.4], fov: 36 }}
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

        positions[p + 0] = x1;
        positions[p + 1] = y1;
        positions[p + 2] = 0;
        positions[p + 3] = x2;
        positions[p + 4] = y2;
        positions[p + 5] = 0;

        baseXY[xy + 0] = x1;
        baseXY[xy + 1] = y1;
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
        opacity: 0.96,
      }),
    []
  );

  const baseCol = useMemo(() => new THREE.Color(baseColor), [baseColor]);

  // Parámetros DOMO + centro móvil en Y
  const params = useRef({
    amp: 0.2, // amplitud del ripple
    speed: 0.9, // velocidad del ripple radial
    freq: 2.8, // menos ondas internas
    domeH: 0.9, // altura de la cúpula
    spin: 0.03, // rotación global lenta
    rainbowWidth: 0.16,
    rainbowStrength: 0.95,
    scanSpeed: 0.8, // scan angular
    // Centro móvil en Y
    centerAmp: radius * 0.22, // desplazamiento máx. del centro (en unidades mundo)
    centerSpeed: 0.75, // velocidad del movimiento del centro
    // Levitación suave del objeto (pos y)
    bobAmp: 0.08,
    bobSpeed: 0.6,
  });

  useFrame((state, delta) => {
    if (!alive.current || !lineRef.current) return;

    const t = state.clock.elapsedTime;
    const p = params.current;

    // Modulación por estado (contenida)
    if (status === "open") {
      p.amp = 0.2;
      p.speed = 0.9;
      p.freq = 2.8;
      p.spin = 0.03;
      p.rainbowStrength = 0.95;
      p.scanSpeed = 0.8;
      p.centerSpeed = 0.75;
      p.centerAmp = radius * 0.22;
      p.bobSpeed = 0.6;
      p.bobAmp = 0.08;
    } else if (status === "connecting") {
      p.amp = 0.22;
      p.speed = 1.2;
      p.freq = 3.2;
      p.spin = 0.05;
      p.rainbowStrength = 0.9;
      p.scanSpeed = 1.2;
      p.centerSpeed = 1.2;
      p.centerAmp = radius * 0.26;
      p.bobSpeed = 0.9;
      p.bobAmp = 0.1;
    } else {
      p.amp = 0.1;
      p.speed = 0.6;
      p.freq = 2.6;
      p.spin = 0.02;
      p.rainbowStrength = 0.5;
      p.scanSpeed = 0.6;
      p.centerSpeed = 0.55;
      p.centerAmp = radius * 0.18;
      p.bobSpeed = 0.5;
      p.bobAmp = 0.06;
    }

    // Centro dinámico en Y (origen del ripple)
    const yCenter = Math.sin(t * p.centerSpeed) * p.centerAmp;

    const geom = lineRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geom.getAttribute("color") as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;
    const base = baseXY;

    let i = 0; // positions/colors stride
    let j = 0; // base stride

    for (let v = 0; v < base.length / 2; v++) {
      const x = base[j++];
      const y = base[j++];
      const r = Math.hypot(x, y - yCenter); // <-- centro móvil en Y
      const rn = THREE.MathUtils.clamp(r / radius, 0, 1);

      // Cúpula base (todo hacia arriba)
      const dome = p.domeH * (1.0 - rn * rn);

      // Ripple radial, atenuado hacia el borde y afectado por yCenter
      const wave = Math.sin(r * p.freq - t * p.speed) * p.amp * (1.0 - rn);

      const z = Math.max(0.0, dome + wave);
      positions[i + 2] = z;

      // Color: cresta + scan angular
      const stress = Math.abs(wave) / Math.max(p.amp, 1e-5);
      const c = 0.85;
      const w = p.rainbowWidth;
      const bandRadial =
        THREE.MathUtils.clamp((stress - (c - w)) / (w * 2), 0, 1) *
        THREE.MathUtils.clamp((c + w - stress) / (w * 2), 0, 1);

      const theta = Math.atan2(y, x);
      const scan = 0.5 + 0.5 * Math.sin(theta * 2.6 + t * p.scanSpeed);
      const band = THREE.MathUtils.clamp(bandRadial * (0.6 + 0.4 * scan), 0, 1);

      const hue =
        (0.58 + 0.22 * Math.sin(t * 0.35 + stress * Math.PI + scan)) % 1.0;
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

    // Pose de cúpula levitando
    lineRef.current.rotation.x = THREE.MathUtils.degToRad(52);
    lineRef.current.rotation.z += delta * p.spin;

    // Levitación vertical sutil del objeto
    const yBob = Math.sin(t * p.bobSpeed) * p.bobAmp;
    lineRef.current.position.y = yBob;
  });

  return <lineSegments ref={lineRef} geometry={geometry} material={material} />;
}
