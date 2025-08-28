"use client";

import React, { useMemo, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

/* =========================================
   Tipos y props
========================================= */
export type UIStatus = "open" | "connecting" | "closed";
type Props = { status: UIStatus; onClick?: () => void };

/* =========================================
   Parámetros por estado (look & ritmo)
========================================= */
function useStatusParams(status: UIStatus) {
  return useMemo(() => {
    if (status === "connecting") {
      return {
        pulseHz: 1.25,
        splashPeriod: 2.2,
        splashPower: 1.0,
        coreColor: new THREE.Color("#18E0FF"),
        accentColor: new THREE.Color("#FDBA74"), // amber-300 para destellos
      };
    }
    if (status === "open") {
      return {
        pulseHz: 0.7,
        splashPeriod: 4.2,
        splashPower: 0.65,
        coreColor: new THREE.Color("#22D3EE"),
        accentColor: new THREE.Color("#7DD3FC"),
      };
    }
    return {
      pulseHz: 0.25,
      splashPeriod: 999,
      splashPower: 0.15,
      coreColor: new THREE.Color("#94A3B8"),
      accentColor: new THREE.Color("#CBD5E1"),
    };
  }, [status]);
}

/* =========================================
   Capa 1 — Nebulosa interna (plasma)
   - Alta densidad, “boiling”
   - Sin geometría sólida; solo partículas
========================================= */
function InnerNebula({ status }: { status: UIStatus }) {
  const alive = useAlive();
  const ptsRef = useRef<THREE.Points>(null);
  const { pulseHz, splashPeriod, splashPower, coreColor, accentColor } =
    useStatusParams(status);

  const count = 1600;

  const base = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // semiesfera irregular comprimida en Y
      const r = 0.35 + Math.random() * 0.25;
      const t = Math.random() * Math.PI * 2;
      const u = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(u) * Math.cos(t);
      const y = r * Math.cos(u) * (0.7 + 0.3 * Math.random());
      const z = r * Math.sin(u) * Math.sin(t);
      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    return arr;
  }, [count]);

  const colors = useMemo(() => {
    const cArr = new Float32Array(count * 3);
    const cold = coreColor.clone();
    const hot = accentColor.clone();
    for (let i = 0; i < count; i++) {
      const mix = Math.random() * 0.35 + 0.15;
      const c = cold.clone().lerp(hot, mix);
      cArr[i * 3 + 0] = c.r;
      cArr[i * 3 + 1] = c.g;
      cArr[i * 3 + 2] = c.b;
    }
    return cArr;
  }, [count, coreColor, accentColor]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(base, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, [base, colors]);

  const mat = useMemo(() => {
    const m = new THREE.PointsMaterial({
      size: 0.035,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return m;
  }, []);

  useFrame(({ clock }, delta) => {
    if (!alive.current) return;
    const p = ptsRef.current;
    if (!p) return;

    const t = clock.elapsedTime;
    const pulse = 1 + 0.11 * Math.sin(t * Math.PI * 2 * pulseHz + 0.7);
    const cycle = t % splashPeriod;
    const splash = cycle < 0.22 ? 1 : cycle < 0.62 ? 0.6 : 0;
    const sp = splashPower * splash;

    p.rotation.y += delta * 0.12;
    p.rotation.x += delta * 0.05;

    const pos = (p.geometry as THREE.BufferGeometry).attributes
      .position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const bx = base[ix + 0];
      const by = base[ix + 1];
      const bz = base[ix + 2];

      // “boiling” + splash
      const n =
        Math.sin(i * 0.031 + t * 2.1) * 0.5 +
        Math.cos(i * 0.017 - t * 1.6) * 0.5;

      const m = pulse + 0.08 * n + 0.12 * sp * n;
      pos.array[ix + 0] = bx * m;
      pos.array[ix + 1] = by * (m * (1 + 0.05 * Math.sin(t * 0.9)));
      pos.array[ix + 2] = bz * m;
    }
    pos.needsUpdate = true;

    const pm = p.material as THREE.PointsMaterial;
    pm.size = 0.026 + 0.02 * pulse + 0.014 * sp;
    pm.opacity = 0.7 + 0.2 * pulse + 0.12 * sp;
  });

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  return <points ref={ptsRef} geometry={geom} material={mat} />;
}

/* =========================================
   Capa 2 — Halo respirante (volumen orbital)
   - Más partículas, mayor radio
   - Rompe simetría con elipsoide + ruido
========================================= */
function BreathingHalo({ status }: { status: UIStatus }) {
  const alive = useAlive();
  const ptsRef = useRef<THREE.Points>(null);
  const { pulseHz, splashPeriod, splashPower, coreColor } =
    useStatusParams(status);

  const count = 2600;

  const base = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const ax = 1.55,
      ay = 1.15,
      az = 1.45;
    for (let i = 0; i < count; i++) {
      const phi = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1; // cos(theta)
      const r =
        1.0 +
        0.12 * (Math.random() - 0.5) +
        0.05 * Math.sin(i * 0.07) +
        0.03 * Math.cos(i * 0.11);

      const s = Math.sqrt(1 - u * u);
      const x = ax * r * s * Math.cos(phi);
      const y = ay * r * u * (0.85 + 0.15 * Math.random());
      const z = az * r * s * Math.sin(phi);
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
    return new THREE.PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      color: coreColor,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [coreColor]);

  useFrame(({ clock }, delta) => {
    if (!alive.current) return;
    const p = ptsRef.current;
    if (!p) return;

    const t = clock.elapsedTime;
    const pulse = 1 + 0.08 * Math.sin(t * Math.PI * 2 * pulseHz);
    const cycle = t % splashPeriod;
    const splash = cycle < 0.22 ? 1 : cycle < 0.62 ? 0.6 : 0;
    const sp = splashPower * splash;

    p.rotation.y += delta * (0.08 + 0.1 * pulseHz);
    p.rotation.x += delta * 0.02;

    const pos = (p.geometry as THREE.BufferGeometry).attributes
      .position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const bx = base[ix + 0];
      const by = base[ix + 1];
      const bz = base[ix + 2];

      const n =
        Math.sin(i * 0.013 + t * 1.5) * 0.5 +
        Math.cos(i * 0.019 - t * 1.1) * 0.5;

      const m = pulse + 0.02 * n + 0.1 * sp * n;
      pos.array[ix + 0] = bx * m;
      pos.array[ix + 1] = by * (m * (1 + 0.04 * Math.sin(t * 0.8)));
      pos.array[ix + 2] = bz * m;
    }
    pos.needsUpdate = true;

    const pm = p.material as THREE.PointsMaterial;
    pm.size = 0.016 + 0.012 * pulse + 0.008 * sp;
    pm.opacity = 0.55 + 0.25 * pulse + 0.12 * sp;
  });

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  return <points ref={ptsRef} geometry={geom} material={mat} />;
}

/* =========================================
   Capa 3 — Tendrilos eléctricos (filamentos)
   - Varios haces de puntos con curva CatmullRom
   - Opacidad/longitud moduladas por el splash
========================================= */
function Tendrils({
  status,
  count = 18,
}: {
  status: UIStatus;
  count?: number;
}) {
  const alive = useAlive();
  const { pulseHz, splashPeriod, splashPower, coreColor, accentColor } =
    useStatusParams(status);

  const groupRef = useRef<THREE.Group>(null);
  const cold = coreColor.clone().lerp(accentColor, 0.18);

  const pointsPer = 44;

  const dirs = useMemo(() => {
    const v: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 + Math.random() * 0.19;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      v.push(new THREE.Vector3(x, y, z).normalize());
    }
    return v;
  }, [count]);

  const mats = useMemo(() => {
    const m = new THREE.PointsMaterial({
      size: 0.026,
      sizeAttenuation: true,
      color: cold,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return m;
  }, [cold]);

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
    const pulse = 1 + 0.1 * Math.sin(t * Math.PI * 2 * pulseHz);
    const cycle = t % splashPeriod;
    const splash = cycle < 0.22 ? 1 : cycle < 0.62 ? 0.6 : 0;
    const sp = splashPower * splash;

    for (let k = 0; k < count; k++) {
      const dir = dirs[k];
      const len = 0.55 + 1.45 * pulse + 0.9 * sp;
      const wob = 0.3 + 0.5 * sp;

      const pts: THREE.Vector3[] = [];
      // base y dos vectores perpendiculares
      const basePerp1 = new THREE.Vector3(-dir.y, dir.x, 0);
      if (basePerp1.lengthSq() < 1e-6) basePerp1.set(0, -dir.z, dir.y);
      basePerp1.normalize();
      const basePerp2 = new THREE.Vector3()
        .crossVectors(dir, basePerp1)
        .normalize();

      for (let i = 0; i < pointsPer; i++) {
        const u = i / (pointsPer - 1);
        const core = dir
          .clone()
          .multiplyScalar(len * (u * (0.85 + 0.15 * Math.sin(t * 0.7))));
        const swirl =
          Math.sin(u * 10 + t * (2.1 + 0.6 * pulse)) * 0.14 +
          Math.cos(u * 6 - t * 1.4) * 0.07;

        const jitter =
          (Math.sin((k + 1) * 0.71 + u * 5 + t * 2.0) +
            Math.cos((k + 1) * 0.37 + u * 9 - t * 1.7)) *
          wob *
          0.035;

        const p = new THREE.Vector3()
          .add(core)
          .addScaledVector(basePerp1, swirl + jitter)
          .addScaledVector(basePerp2, swirl * 0.6 - jitter * 0.55);

        pts.push(p);
      }

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

    mats.opacity = 0.45 + 0.35 * pulse + 0.25 * sp;
    mats.size = 0.02 + 0.02 * pulse + 0.016 * sp;
  });

  useEffect(() => {
    return () => {
      geoms.forEach((g) => g.dispose());
      mats.dispose();
    };
  }, [geoms, mats]);

  return (
    <group ref={groupRef}>
      {geoms.map((g, i) => (
        <points key={i} geometry={g} material={mats} />
      ))}
    </group>
  );
}

/* =========================================
   Capa 4 — Chispas de splash (emisión)
   - Grupo pequeño que “sale” y vuelve
========================================= */
function SplashSparks({
  status,
  count = 220,
}: {
  status: UIStatus;
  count?: number;
}) {
  const alive = useAlive();
  const ptsRef = useRef<THREE.Points>(null);
  const { pulseHz, splashPeriod, splashPower, accentColor } =
    useStatusParams(status);

  const base = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // cerca del centro
      const r = Math.random() * 0.18 + 0.05;
      const a = Math.random() * Math.PI * 2;
      const u = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(u) * Math.cos(a);
      const y = r * Math.cos(u);
      const z = r * Math.sin(u) * Math.sin(a);
      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    return arr;
  }, [count]);

  const vel = useMemo(() => {
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const u = Math.acos(2 * Math.random() - 1);
      const x = Math.sin(u) * Math.cos(a);
      const y = Math.cos(u);
      const z = Math.sin(u) * Math.sin(a);
      const s = 0.6 + Math.random() * 0.9;
      v[i * 3 + 0] = x * s;
      v[i * 3 + 1] = y * s;
      v[i * 3 + 2] = z * s;
    }
    return v;
  }, [count]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(base, 3));
    return g;
  }, [base]);

  const mat = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.026,
      sizeAttenuation: true,
      color: accentColor,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [accentColor]);

  // estado interno del splash
  const life = useRef<number>(0); // [0..1] durante el burst
  const lastCycle = useRef<number>(-1);

  useFrame(({ clock }, delta) => {
    if (!alive.current) return;
    const p = ptsRef.current;
    if (!p) return;

    const t = clock.elapsedTime;
    const pulse = 1 + 0.06 * Math.sin(t * Math.PI * 2 * pulseHz);
    const period = splashPeriod;

    const cycle = Math.floor(t / period);
    if (cycle !== lastCycle.current && t % period < 0.05) {
      lastCycle.current = cycle;
      life.current = 1; // activar burst
    }

    // decaer vida
    life.current = Math.max(0, life.current - delta * 1.6);

    const pos = (p.geometry as THREE.BufferGeometry).attributes
      .position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const bx = base[ix + 0];
      const by = base[ix + 1];
      const bz = base[ix + 2];

      const vx = vel[ix + 0];
      const vy = vel[ix + 1];
      const vz = vel[ix + 2];

      // salir y volver al centro con fricción
      const k = life.current * splashPower;
      const out = 1.0 + 0.9 * k;
      const back = 1.0 - 0.55 * (1 - k);

      pos.array[ix + 0] = bx * back + vx * 0.08 * out;
      pos.array[ix + 1] = by * back + vy * 0.08 * out;
      pos.array[ix + 2] = bz * back + vz * 0.08 * out;
    }
    pos.needsUpdate = true;

    const pm = p.material as THREE.PointsMaterial;
    pm.opacity = 0.0 + 0.9 * life.current;
    pm.size = 0.02 + 0.015 * pulse + 0.02 * life.current;
  });

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  return <points ref={ptsRef} geometry={geom} material={mat} />;
}

/* =========================================
   Escena raíz + renderer
========================================= */
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
      <BreathingHalo status={status} />
      <Tendrils status={status} />
      <SplashSparks status={status} />
    </>
  );
}

/* =========================================
   Componente público
========================================= */
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
