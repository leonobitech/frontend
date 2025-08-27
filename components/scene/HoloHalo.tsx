// components/scene/HoloHalo.tsx
"use client";
import React, { useMemo, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export type Status = "open" | "connecting" | "closed";

type Props = { status: Status; onClick?: () => void };

/* ======= helpers ======= */
function useStatusDriver(status: Status) {
  const kRef = React.useRef(0); // 0=closed, 1=connecting, 2=open
  useEffect(() => {
    kRef.current = status === "closed" ? 0 : status === "connecting" ? 1 : 2;
  }, [status]);
  return kRef;
}

/* ======= constantes visuales ======= */
const VORTEX_R = 1.25; // radio máximo del vórtice
const VORTEX_H = 2.0; // altura total del vórtice
const CORE_R = 0.25; // radio del núcleo (atractor)
const COUNT_DESKTOP = 8000; // micro-partículas
const COUNT_MOBILE = 4200;

export function HoloHalo({ status, onClick }: Props) {
  return (
    <div className="w-96 h-96 rounded-full overflow-hidden bg-transparent relative">
      <Canvas
        className="!bg-transparent absolute inset-0"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3.2], fov: 34 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <Scene status={status} onClick={onClick} />
      </Canvas>
    </div>
  );
}

/* ================================ ESCENA ================================ */
function Scene({ status, onClick }: { status: Status; onClick?: () => void }) {
  const root = useRef<THREE.Group>(null);
  const kRef = useStatusDriver(status);

  // “respira” completo sin tocar tamaño en píxeles de cada punto
  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const k = kRef.current;
    const amp = THREE.MathUtils.lerp(0.03, 0.08, k / 2);
    const s = 1.0 + amp * Math.sin(t * (0.7 + 0.3 * k));
    g.scale.setScalar(s);
  });

  return (
    <group ref={root}>
      <CoreGlow status={status} />
      <VortexParticles status={status} onClick={onClick} />
      <OuterHalo status={status} />
    </group>
  );
}

/* =========================== NÚCLEO LUMINOSO =========================== */
function CoreGlow({ status }: { status: Status }) {
  const mref =
    useRef<THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshBasicMaterial>>(
      null
    );
  const { geo, mat } = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(CORE_R, 2);
    const m = new THREE.MeshBasicMaterial({
      color: 0x9ae6ff,
      transparent: true,
      opacity: 0.9,
    });
    return { geo: g, mat: m };
  }, []);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat]
  );

  const kRef = useStatusDriver(status);
  useFrame(({ clock }) => {
    const m = mref.current;
    if (!m) return;
    const t = clock.getElapsedTime();
    const k = kRef.current;
    m.rotation.x = t * 0.4;
    m.rotation.y = t * 0.6;
    m.material.opacity = 0.6 + 0.3 * Math.sin(t * (2.0 + 0.4 * k));
  });

  return <mesh ref={mref} geometry={geo} material={mat} />;
}

/* ========================== HALO EXTERIOR SUTIL ========================= */
function OuterHalo({ status }: { status: Status }) {
  const ringRef =
    useRef<THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>>(null);
  const { geo, mat } = useMemo(() => {
    const g = new THREE.RingGeometry(VORTEX_R * 0.92, VORTEX_R * 0.98, 128);
    const m = new THREE.MeshBasicMaterial({
      color: 0x00eaff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { geo: g, mat: m };
  }, []);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat]
  );

  const kRef = useStatusDriver(status);
  useFrame(({ clock }) => {
    const r = ringRef.current;
    if (!r) return;
    const t = clock.getElapsedTime();
    const k = kRef.current;
    r.rotation.x = Math.PI / 2;
    r.rotation.z = t * (0.15 + 0.05 * k);
    r.material.opacity = THREE.MathUtils.lerp(0.12, 0.28, k / 2);
  });

  return <mesh ref={ringRef} geometry={geo} material={mat} />;
}

/* ============================= VÓRTICE ============================= */
function VortexParticles({
  status,
  onClick,
}: {
  status: Status;
  onClick?: () => void;
}) {
  const pointsRef =
    useRef<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>>(null);
  const kRef = useStatusDriver(status);

  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));

  const COUNT = isMobile ? COUNT_MOBILE : COUNT_DESKTOP;

  // textura circular con borde suave
  const circleTex = useMemo(() => {
    const size = 96;
    const cvs = document.createElement("canvas");
    cvs.width = cvs.height = size;
    const ctx = cvs.getContext("2d")!;
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    g.addColorStop(0.0, "rgba(255,255,255,1)");
    g.addColorStop(0.75, "rgba(255,255,255,0.4)");
    g.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, []);

  // geometría base en coordenadas cilíndricas → (r, theta, y)
  const { geometry, baseR, baseTheta, baseY, seeds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const baseR = new Float32Array(COUNT);
    const baseTheta = new Float32Array(COUNT);
    const baseY = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Sesgo: más cerca del borde para sentir “paredeo” y túnel
      const rBias = Math.pow(Math.random(), 0.6);
      const r = THREE.MathUtils.lerp(CORE_R * 0.6, VORTEX_R, rBias);
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * VORTEX_H;

      baseR[i] = r;
      baseTheta[i] = theta;
      baseY[i] = y;
      seeds[i] = Math.random();

      // posición inicial
      pos[i * 3 + 0] = r * Math.cos(theta);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = r * Math.sin(theta);
    }

    const attr = new THREE.BufferAttribute(pos, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", attr);
    return { geometry: g, baseR, baseTheta, baseY, seeds };
  }, [COUNT]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: isMobile ? 0.012 : 0.014,
      sizeAttenuation: true,
      map: circleTex,
      alphaMap: circleTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color(0x86e0ff), // base fría; el tinte se anima
      opacity: 0.95,
    });
  }, [circleTex, isMobile]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      circleTex.dispose();
    };
  }, [geometry, material, circleTex]);

  const handleClick = useCallback(() => onClick?.(), [onClick]);

  /**
   * Campo de flujo del vórtice:
   * - ángulo: gira con velocidad base + swirl dependiente de Y
   * - radio: “in-flow” leve hacia el núcleo y micro respiración
   * - vertical: deriva sinusoidal para efecto tornado
   */
  useFrame(({ clock }) => {
    const pts = pointsRef.current;
    if (!pts) return;

    const t = clock.getElapsedTime();
    const k = kRef.current;

    const arr = pts.geometry.attributes.position.array as Float32Array;

    // Parámetros dinámicos según status (k)
    const angVel = THREE.MathUtils.lerp(0.6, 1.4, k / 2); // velocidad angular
    const swirlY = THREE.MathUtils.lerp(0.9, 1.6, k / 2); // cuánto aporta Y al giro
    const inFlow = THREE.MathUtils.lerp(0.002, 0.008, k / 2); // “caída” al núcleo
    const breathe = 0.03 * Math.sin(t * (0.8 + 0.4 * k));
    const vWaveAmp = THREE.MathUtils.lerp(0.02, 0.06, k / 2);
    const vWaveSpd = 1.8 + 0.6 * k;

    for (let i = 0; i < COUNT; i++) {
      const r0 = baseR[i];
      const th0 = baseTheta[i];
      const y0 = baseY[i];
      const s = seeds[i];

      // radio con “in-flow” (acerca suavemente al núcleo + respiración)
      const r = Math.max(
        CORE_R * 0.65,
        r0 * (1.0 - inFlow) + breathe * (0.5 - s)
      );

      // ángulo: base + swirl por Y + fase personal
      const theta = th0 + angVel * t + swirlY * (y0 * 0.2) + s * Math.PI * 2;

      // vertical con onda (tornado)
      const y =
        y0 * (0.92 + 0.04 * Math.sin(t * 0.5 + s * 6.283)) +
        vWaveAmp * Math.sin(t * vWaveSpd + s * 10.0);

      // posición
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      // clamp suave al cilindro del vórtice (y a la esfera visual)
      const len = Math.hypot(x, y * 0.6, z);
      const maxR = VORTEX_R * 0.995;
      if (len > maxR) {
        const sc = maxR / len;
        arr[i * 3 + 0] = x * sc;
        arr[i * 3 + 1] = y * sc;
        arr[i * 3 + 2] = z * sc;
      } else {
        arr[i * 3 + 0] = x;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = z;
      }
    }

    pts.geometry.attributes.position.needsUpdate = true;

    // Tinte “auroral” animado (sin tocar por-vértice)
    const hue = (t * 18) % 360;
    pts.material.color.setHSL(hue / 360, 0.65, 0.65);
    pts.material.opacity = 0.85 + 0.15 * Math.sin(t * 1.6);
  });

  return (
    <points ref={pointsRef} args={[geometry, material]} onClick={handleClick} />
  );
}
