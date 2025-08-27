// components/scene/HoloHalo.tsx
"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export type Status = "open" | "connecting" | "closed";

type Props = {
  status: Status;
  onClick?: () => void;
};

/**
 * Contenedor circular con utilidades estándar de Tailwind.
 * (Si querés otro tamaño, cambiá w-96/h-96 por w-80/h-80, etc.)
 */
export function HoloHalo({ status, onClick }: Props) {
  return (
    <div className="w-96 h-96 rounded-full overflow-hidden bg-transparent relative">
      <Canvas
        className="!bg-transparent absolute inset-0"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <NebulaV2 status={status} onClick={onClick} />
      </Canvas>
    </div>
  );
}

/* =============================================================================
 * NebulaV2
 * - Nube 3D con mayor densidad en el núcleo
 * - Pulso explosión/implosión + flujo (curl noise barato)
 * - Grupo de "chispas" en el core con flicker
 * - Todo con PointsMaterial (estable y portable)
 * ============================================================================= */
function NebulaV2({
  status,
  onClick,
}: {
  status: Status;
  onClick?: () => void;
}) {
  const mainRef = useRef<THREE.Points>(null!);
  const sparksRef = useRef<THREE.Points>(null!);

  // Perfil móvil/desktop
  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));

  // ---- Parámetros visuales base ----
  const COUNT = isMobile ? 2600 : 4200; // partículas “nebulosa”
  const SPARKS = isMobile ? 30 : 48; // chispas del core
  const RADIUS = 1.25; // radio de la esfera
  const SIZE_MAIN = isMobile ? 0.028 : 0.032;
  const SIZE_SPARK = isMobile ? 0.06 : 0.075;

  // ---- Textura circular (disco con alpha suave) ----
  const dotTex = useMemo(() => makeCircleTexture(128, 1.0, 0.45), []);
  const sparkTex = useMemo(() => makeCircleTexture(128, 1.0, 0.0), []);

  // ---- Geometría principal: sesgo de densidad hacia el núcleo ----
  const { mainGeometry, basePositions, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT); // variación de ruido/flujo
    const phases = new Float32Array(COUNT); // desfase del pulso
    const radii = new Float32Array(COUNT); // radio base (para pulso)

    // 70% núcleo (0.04R..0.38R), 30% periferia (0.38R..1.0R)
    const coreCount = Math.floor(COUNT * 0.7);
    let i3 = 0;

    const pushPoint = (rMin: number, rMax: number) => {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = RADIUS * (rMin + Math.random() * (rMax - rMin));
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 0] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      seeds[i3 / 3] = Math.random();
      phases[i3 / 3] = Math.random();
      radii[i3 / 3] = r;
      i3 += 3;
    };

    for (let i = 0; i < coreCount; i++) pushPoint(0.04, 0.38);
    for (let i = coreCount; i < COUNT; i++) pushPoint(0.38, 1.0);

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { mainGeometry: g, basePositions: positions, seeds, phases, radii };
  }, [COUNT]);

  // ---- Geometría de chispas (alrededor del núcleo) ----
  const { sparksGeometry, sparksBase, sparksPhase } = useMemo(() => {
    const positions = new Float32Array(SPARKS * 3);
    const phase = new Float32Array(SPARKS);
    for (let i = 0; i < SPARKS; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      // muy cerca del centro
      const r = RADIUS * (0.03 + Math.random() * 0.12);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      phase[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { sparksGeometry: g, sparksBase: positions, sparksPhase: phase };
  }, [SPARKS]);

  // ---- Materiales ----
  const mainMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: SIZE_MAIN,
        sizeAttenuation: true,
        map: dotTex,
        alphaMap: dotTex,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color(0x00eaff),
        opacity: 0.9,
      }),
    [SIZE_MAIN, dotTex]
  );

  const sparkMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: SIZE_SPARK,
        sizeAttenuation: true,
        map: sparkTex,
        alphaMap: sparkTex,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color(0xffffff), // chispa más blanca
        opacity: 1.0,
      }),
    [SIZE_SPARK, sparkTex]
  );

  // ---- Animación: pulso + flujo + brillo por estado ----
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // escala de estado: 0 (closed) → 2 (open)
    const k = status === "closed" ? 0 : status === "connecting" ? 1 : 2;

    // Pulso global (explosión ↔ implosión)
    const pulseGlobal = Math.sin(t * (0.8 + 0.4 * k)); // -1..1
    const ampGlobal = THREE.MathUtils.lerp(0.08, 0.22, k / 2); // amplitud del pulso radial

    // ---- Nube principal ----
    if (mainRef.current) {
      const arr = mainRef.current.geometry.attributes.position
        .array as Float32Array;

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;

        // base radial (mantiene la distribución original)
        const bx = basePositions[i3 + 0];
        const by = basePositions[i3 + 1];
        const bz = basePositions[i3 + 2];

        // pulso local por partícula (desfase evita sincronía rígida)
        const local = Math.sin(t * (1.0 + 0.6 * k) + phases[i] * Math.PI * 2.0);
        const pulse = 1.0 + ampGlobal * (0.5 * pulseGlobal + 0.5 * local);

        // flujo “con aire” (curl noise barato y temporal)
        const px = bx,
          py = by,
          pz = bz;
        const curlX =
          Math.sin(py * 2.1 + t * 0.8) + Math.cos(pz * 2.7 - t * 0.55);
        const curlY =
          Math.sin(pz * 2.0 + t * 0.7) + Math.cos(px * 2.3 - t * 0.5);
        const curlZ =
          Math.sin(px * 1.9 + t * 0.6) + Math.cos(py * 2.5 - t * 0.6);
        const curlStrength = THREE.MathUtils.lerp(0.02, 0.06, k / 2); // fuerza según estado

        // mezcla: posición base * pulso + flujo
        arr[i3 + 0] = bx * pulse + curlX * curlStrength;
        arr[i3 + 1] = by * pulse + curlY * curlStrength;
        arr[i3 + 2] = bz * pulse + curlZ * curlStrength;
      }

      mainRef.current.geometry.attributes.position.needsUpdate = true;

      // rotación global sutil para mejorar profundidad
      mainRef.current.rotation.y = t * 0.1;
      mainRef.current.rotation.x = Math.sin(t * 0.06) * 0.1;

      // brillo general según estado
      (mainRef.current.material as THREE.PointsMaterial).opacity =
        THREE.MathUtils.lerp(0.35, 0.92, k / 2);
    }

    // ---- Chispas del núcleo ----
    if (sparksRef.current) {
      const arr = sparksRef.current.geometry.attributes.position
        .array as Float32Array;

      for (let i = 0; i < SPARKS; i++) {
        const i3 = i * 3;
        // jitter orbital cerca del centro
        const phase = sparksPhase[i];
        const r = 0.04 * Math.sin(t * 2.2 + phase * 10.0) + 0.08;
        const ang = t * (1.6 + k * 0.4) + phase * Math.PI * 2;
        // posición base (cerca del centro) + órbita mínima
        const bx = sparksBase[i3 + 0];
        const by = sparksBase[i3 + 1];
        const bz = sparksBase[i3 + 2];

        // pequeña órbita en el plano XZ
        arr[i3 + 0] = bx + Math.cos(ang) * r;
        arr[i3 + 1] = by + Math.sin(ang * 0.9) * (r * 0.5);
        arr[i3 + 2] = bz + Math.sin(ang) * r;
      }

      sparksRef.current.geometry.attributes.position.needsUpdate = true;

      // flicker por estado (chispa más fuerte en open)
      (sparksRef.current.material as THREE.PointsMaterial).opacity =
        THREE.MathUtils.lerp(
          0.5,
          1.0,
          (k / 2) * (0.8 + 0.2 * Math.sin(t * 8.0))
        );
    }
  });

  return (
    <group>
      {/* Nube principal */}
      <points
        ref={mainRef}
        args={[mainGeometry, mainMat]}
        onClick={useCallback(() => onClick?.(), [onClick])}
      />
      {/* Chispas del núcleo */}
      <points ref={sparksRef} args={[sparksGeometry, sparkMat]} />
    </group>
  );
}

/** Genera una textura circular con degradado (para PointsMaterial) */
function makeCircleTexture(size: number, centerAlpha = 1.0, midAlpha = 0.45) {
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
  g.addColorStop(0.0, `rgba(255,255,255,${centerAlpha})`);
  g.addColorStop(0.85, `rgba(255,255,255,${midAlpha})`);
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(cvs);
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}
