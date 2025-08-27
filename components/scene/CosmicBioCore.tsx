"use client";

import React, { useMemo, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

/* ------------------------- Tipos ------------------------- */
export type UIStatus = "open" | "connecting" | "closed";
type Props = { status: UIStatus; onClick?: () => void };

/* -------------------- Utils de animación -------------------- */
function useStatusParams(status: UIStatus) {
  // Parámetros globales por estado
  return useMemo(() => {
    if (status === "connecting") {
      return {
        pulseFreq: 1.35, // Hz
        splashEvery: 2.0, // s
        splashIntensity: 1.0,
        colorCore: new THREE.Color("#22d3ee"), // cyan
        colorHot: new THREE.Color("#f59e0b"), // amber highlights
      };
    }
    if (status === "open") {
      return {
        pulseFreq: 0.7,
        splashEvery: 4.0,
        splashIntensity: 0.65,
        colorCore: new THREE.Color("#22d3ee"),
        colorHot: new THREE.Color("#7dd3fc"), // light-cyan accents
      };
    }
    return {
      pulseFreq: 0.2,
      splashEvery: 999,
      splashIntensity: 0.2,
      colorCore: new THREE.Color("#94a3b8"),
      colorHot: new THREE.Color("#cbd5e1"),
    };
  }, [status]);
}

/* -------------------- Halo de partículas -------------------- */
function HaloParticles({ status }: { status: UIStatus }) {
  const pointsRef = useRef<THREE.Points>(null);
  const alive = useAlive();
  const { pulseFreq, splashEvery, splashIntensity, colorCore } =
    useStatusParams(status);

  const count = 2600;
  // Posiciones base: elipsoide irregular + jitter
  const basePositions = useMemo(() => {
    const a = 1.55,
      b = 1.2,
      c = 1.45;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.random() * Math.PI * 2;
      const costh = Math.random() * 2 - 1; // [-1,1]
      const r =
        0.9 +
        0.18 * (Math.random() - 0.5) +
        0.06 * Math.sin(i * 0.07) +
        0.04 * Math.cos(i * 0.13);
      const sinth = Math.sqrt(1 - costh * costh);
      const x = a * r * sinth * Math.cos(phi);
      const y = b * r * costh * (0.8 + 0.2 * Math.random());
      const z = c * r * sinth * Math.sin(phi);
      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    return arr;
  }, [count]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(basePositions, 3)
    );
    return g;
  }, [basePositions]);

  const mat = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      color: colorCore,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [colorCore]);

  // Buffers mutables para offsets sutiles (boiling + splash)
  const offsets = useMemo(() => new Float32Array(count).fill(0), [count]);

  useFrame(({ clock }, delta) => {
    if (!alive.current) return;
    const p = pointsRef.current;
    if (!p) return;

    const t = clock.elapsedTime;
    const pulse = 1 + 0.08 * Math.sin(t * Math.PI * 2 * pulseFreq);

    // Determinar si estamos en "splash window"
    const cycle = t % splashEvery;
    const inSplash =
      cycle < 0.25 // ventana corta de burst
        ? 1
        : cycle < 0.6
        ? 0.6 // dissipate
        : 0;

    const splashAmp = splashIntensity * (inSplash as number);

    // Animación: rotación + respiración + micro jitter
    p.rotation.y += delta * (0.08 + 0.12 * pulseFreq);
    p.rotation.x += delta * 0.02;

    const pos = (p.geometry as THREE.BufferGeometry).getAttribute(
      "position"
    ) as THREE.BufferAttribute;

    // Micro-deformación (CPU-ligera)
    for (let i = 0; i < count; i++) {
      // ruido suave basado en índice y tiempo
      const n =
        Math.sin(i * 0.013 + t * 1.7) * 0.5 +
        Math.cos(i * 0.021 - t * 1.1) * 0.5;
      offsets[i] = 0.02 * n + splashAmp * 0.12 * n;

      const ix = i * 3;
      const bx = basePositions[ix + 0];
      const by = basePositions[ix + 1];
      const bz = basePositions[ix + 2];

      const m = pulse + offsets[i];
      pos.array[ix + 0] = bx * m;
      pos.array[ix + 1] = by * (m * (1 + 0.05 * Math.sin(t * 0.7)));
      pos.array[ix + 2] = bz * m;
    }
    pos.needsUpdate = true;

    // Respiración de material
    const pm = p.material as THREE.PointsMaterial;
    pm.opacity = 0.55 + 0.35 * pulse + 0.15 * splashAmp;
    pm.size = 0.015 + 0.012 * pulse + 0.006 * splashAmp;
  });

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  return <points ref={pointsRef} geometry={geom} material={mat} />;
}

/* -------------------- Nube energética interna -------------------- */
function InnerNebula({ status }: { status: UIStatus }) {
  const alive = useAlive();
  const ptsRef = useRef<THREE.Points>(null);
  const { pulseFreq, splashEvery, splashIntensity, colorCore, colorHot } =
    useStatusParams(status);

  const count = 1200;
  const base = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 0.35 + Math.random() * 0.25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * (0.8 + 0.2 * Math.random());
      const z = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    return arr;
  }, [count]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(base, 3));
    return g;
  }, [base]);

  const mat = useMemo(() => {
    const c = colorCore.clone().lerp(colorHot, 0.25);
    return new THREE.PointsMaterial({
      size: 0.03,
      sizeAttenuation: true,
      color: c,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [colorCore, colorHot]);

  useFrame(({ clock }, delta) => {
    if (!alive.current) return;
    const p = ptsRef.current;
    if (!p) return;

    const t = clock.elapsedTime;
    const pulse = 1 + 0.12 * Math.sin(t * Math.PI * 2 * pulseFreq + 0.7);
    const cycle = t % splashEvery;
    const inSplash = cycle < 0.25 ? 1 : cycle < 0.6 ? 0.6 : 0;
    const splashAmp = splashIntensity * (inSplash as number);

    p.rotation.y -= delta * 0.18;
    p.rotation.x += delta * 0.06;

    const pos = (p.geometry as THREE.BufferGeometry).getAttribute(
      "position"
    ) as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const bx = base[ix + 0];
      const by = base[ix + 1];
      const bz = base[ix + 2];

      const n = Math.sin(i * 0.031 + t * 2.2) * Math.cos(i * 0.017 - t * 1.6);
      const m = pulse + 0.08 * n + 0.12 * splashAmp * n;

      pos.array[ix + 0] = bx * m;
      pos.array[ix + 1] = by * m;
      pos.array[ix + 2] = bz * m;
    }
    pos.needsUpdate = true;

    const pm = p.material as THREE.PointsMaterial;
    pm.opacity = 0.75 + 0.2 * pulse + 0.1 * splashAmp;
    pm.size = 0.024 + 0.016 * pulse + 0.01 * splashAmp;
  });

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  return <points ref={ptsRef} geometry={geom} material={mat} />;
}

/* -------------------- Tendrilos energéticos -------------------- */
function Tendrils({
  status,
  count = 16,
}: {
  status: UIStatus;
  count?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const alive = useAlive();
  const { pulseFreq, splashEvery, splashIntensity, colorCore, colorHot } =
    useStatusParams(status);

  // Semillas direccionales
  const dirs = useMemo(() => {
    const v: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 + Math.random() * 0.25;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      v.push(new THREE.Vector3(x, y, z).normalize());
    }
    return v;
  }, [count]);

  // puntos por tendril
  const pointsPer = 40;

  // materiales
  const cold = colorCore.clone().lerp(colorHot, 0.15);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.028,
        sizeAttenuation: true,
        color: cold,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [cold]
  );

  // Geometrías por tendril
  const geoms = useMemo(() => {
    const gs: THREE.BufferGeometry[] = [];
    for (let k = 0; k < count; k++) {
      const g = new THREE.BufferGeometry();
      const arr = new Float32Array(pointsPer * 3);
      g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
      gs.push(g);
    }
    return gs;
  }, [count]);

  useFrame(({ clock }) => {
    if (!alive.current) return;
    const t = clock.elapsedTime;
    const pulse = 1 + 0.1 * Math.sin(t * Math.PI * 2 * pulseFreq);
    const cycle = t % splashEvery;
    const inSplash = cycle < 0.25 ? 1 : cycle < 0.6 ? 0.6 : 0;
    const splashAmp = splashIntensity * (inSplash as number);

    // Para cada tendril, recalcular puntos a lo largo de una curva que “late”
    for (let k = 0; k < count; k++) {
      const dir = dirs[k];
      const len = 0.5 + 1.6 * pulse + 0.9 * splashAmp; // longitud dinámica
      const wobble = 0.35 + 0.45 * splashAmp; // sinuosidad
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < pointsPer; i++) {
        const u = i / (pointsPer - 1); // [0..1]
        const base = dir.clone().multiplyScalar(len * u);
        // perturbación perpendicular usando dos vectores ortogonales
        const perp1 = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
        if (perp1.lengthSq() < 1e-6) perp1.set(0, -dir.z, dir.y).normalize();
        const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize();

        const swirl =
          Math.sin(u * 10 + t * (2.0 + 0.8 * pulse)) * 0.15 +
          Math.cos(u * 6 - t * 1.3) * 0.08;

        const jitter =
          (Math.sin((k + 1) * 0.7 + u * 5 + t * 2.1) +
            Math.cos((k + 1) * 0.37 + u * 9 - t * 1.6)) *
          wobble *
          0.04;

        const p = new THREE.Vector3()
          .add(base)
          .addScaledVector(perp1, swirl + jitter)
          .addScaledVector(perp2, swirl * 0.6 - jitter * 0.5);

        pts.push(p);
      }

      // Suavizar con CatmullRom
      const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
      const out = curve.getPoints(pointsPer - 1);
      const arr = (geoms[k].attributes.position as THREE.BufferAttribute)
        .array as Float32Array;
      for (let i = 0; i < pointsPer; i++) {
        const v = out[i];
        arr[i * 3 + 0] = v.x;
        arr[i * 3 + 1] = v.y;
        arr[i * 3 + 2] = v.z;
      }
      geoms[k].attributes.position.needsUpdate = true;
    }

    // Respiración del material
    mat.opacity = 0.5 + 0.35 * pulse + 0.25 * splashAmp;
    mat.size = 0.02 + 0.02 * pulse + 0.015 * splashAmp;
  });

  useEffect(() => {
    return () => {
      geoms.forEach((g) => g.dispose());
      mat.dispose();
    };
  }, [geoms, mat]);

  return (
    <group ref={groupRef}>
      {geoms.map((g, idx) => (
        <points key={idx} geometry={g} material={mat} />
      ))}
    </group>
  );
}

/* -------------------- Escena y renderer -------------------- */
function SceneRoot({ status }: { status: UIStatus }) {
  const { gl, scene, camera } = useThree();
  useSceneCleanup();

  useEffect(() => {
    scene.background = null;
    camera.position.set(0, 0, 3.6);
    const r = gl as THREE.WebGLRenderer;
    r.setClearAlpha(0);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, [gl, scene, camera]);

  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[2, 2, 3]} intensity={1.1} />
      <pointLight position={[-2, -2, -3]} intensity={0.6} />
      <InnerNebula status={status} />
      <Tendrils status={status} />
      <HaloParticles status={status} />
    </>
  );
}

/* -------------------- Componente público -------------------- */
export function CosmicBioCore({ status, onClick }: Props) {
  const handleClick = useCallback(() => onClick?.(), [onClick]);

  return (
    <button
      type="button"
      aria-label={status === "open" ? "Desconectar" : "Conectando"}
      onClick={handleClick}
      className={[
        "relative block",
        "w-[56vmin] h-[56vmin] max-w-[360px] max-h-[360px] min-w-[240px] min-h-[240px]",
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
