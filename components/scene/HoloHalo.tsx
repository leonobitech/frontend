// components/scene/HoloHalo.tsx
"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

/**
 * Estados visuales del halo:
 * - "closed": tenue
 * - "connecting": pulsación media
 * - "open": más brillante e intenso
 */
export type Status = "open" | "connecting" | "closed";

type Props = {
  /** Estado visual del halo (controla pulso y brillo) */
  status: Status;
  /** Click “burbujea” hacia afuera (para montar/desmontar o lo que necesites) */
  onClick?: () => void;
};

/**
 * HoloHalo (línea base estable)
 * - Contenedor circular con tamaño fijo usando clases estándar Tailwind (w-96/h-96).
 * - Canvas transparente (el fondo lo maneja tu layout).
 * - Núcleo "ParticleNebula": nube de partículas 3D con espesor, pulso y rotación.
 */
export function HoloHalo({ status, onClick }: Props) {
  return (
    // Contenedor circular, sin clases arbitrarias (v4-friendly)
    <div className="w-96 h-96 rounded-full overflow-hidden bg-transparent relative">
      <Canvas
        // El Canvas ocupa todo el contenedor circular (absolute + inset-0)
        className="!bg-transparent absolute inset-0"
        dpr={[1, 1.5]} // cap de DPR para performance en móvil
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => gl.setClearAlpha(0)} // fondo realmente transparente
      >
        <ParticleNebula status={status} onClick={onClick} />
      </Canvas>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Núcleo de partículas (fiable y liviano)
 * - Sin shaders custom: usamos THREE.Points + PointsMaterial con una textura
 *   circular generada en runtime (CanvasTexture) para que cada punto tenga
 *   borde suave y alpha correcto.
 * - Distribución esférica con “espesor” → se ve nube, no un bloque sólido.
 * - Animación muy ligera: pulsación radial + rotación global.
 * - Responde al `status`: closed < connecting < open (brillo/pulso).
 * ---------------------------------------------------------------------------*/
function ParticleNebula({
  status,
  onClick,
}: {
  status: Status;
  onClick?: () => void;
}) {
  // Referencia a la entidad de puntos para actualizar en cada frame
  const pointsRef = useRef<THREE.Points>(null!);

  // Heurística simple para móvil (menos puntos / tamaño de punto similar)
  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));

  // Cantidad de partículas total (ajusta para más “aire” o más densidad)
  const COUNT = isMobile ? 2200 : 3600;

  // Radio medio de la nube (las partículas se ubican entre 65% y 100% de este valor)
  const RADIUS = 1.2;

  // Tamaño del punto en coordenadas del mundo (no en píxeles)
  const POINT_SIZE_WORLD = isMobile ? 0.028 : 0.034;

  // --- Textura circular (alpha suave) para PointsMaterial ---
  // Evita que el punto sea un “cuadrado”, genera un disco con degradado.
  const circleTex = useMemo(() => {
    const size = 128;
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
    g.addColorStop(0.85, "rgba(255,255,255,0.45)");
    g.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearMipMapLinearFilter; // mipmaps para suavidad
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, []);

  // --- Geometría y buffers ---
  // Generamos posiciones 3D en esfera con espesor, y una semilla por punto
  // para variar la fase del pulso (evita que todo “respire” igual).
  const { geometry, basePositions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Muestra uniforme en la esfera (theta/phi) + radio aleatorio (espesor)
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = RADIUS * (0.65 + 0.35 * Math.random()); // 65%..100% del radio
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Semilla por partícula: controla la fase del pulso para desincronizarlas
      seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry, basePositions: positions, seeds };
  }, [COUNT]);

  // --- Material nativo y estable ---
  // AdditiveBlending para brillo “holográfico”. AlphaMap = CircleTex para disco suave.
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: POINT_SIZE_WORLD,
      sizeAttenuation: true,
      map: circleTex,
      alphaMap: circleTex,
      transparent: true,
      alphaTest: 0.01, // descarta pixeles casi transparentes (menos overdraw)
      depthWrite: false, // importante con blending aditivo
      blending: THREE.AdditiveBlending,
      color: new THREE.Color(0x00eaff), // cian base (cámbialo si querés)
      opacity: 0.85,
    });
  }, [POINT_SIZE_WORLD, circleTex]);

  // --- Animación por frame ---
  // Pulso radial MUY ligero (CPU) + rotación global para dar “vida”.
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    const t = clock.getElapsedTime();
    const arr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    // Escala de estado (0 → 2) para controlar intensidad de pulso/brillo
    const stateK = status === "closed" ? 0 : status === "connecting" ? 1 : 2;

    // Amplitud y velocidad del pulso en función del estado
    const pulseAmp = 0.04 * (0.5 + 0.5 * stateK * 0.6); // 0.02..0.08 aprox
    const pulseSpd = 0.9 + 1.5 * stateK;

    // Recalcula posiciones aplicando un factor radial (f) por partícula
    // COUNT ~3.6k → coste muy bajo y estable
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const f = 1.0 + pulseAmp * Math.sin(t * pulseSpd + s * 6.28318);
      arr[i * 3 + 0] = basePositions[i * 3 + 0] * f;
      arr[i * 3 + 1] = basePositions[i * 3 + 1] * f;
      arr[i * 3 + 2] = basePositions[i * 3 + 2] * f;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Rotación global sutil (mejora percepción de volumen)
    pointsRef.current.rotation.y = t * 0.12;
    pointsRef.current.rotation.x = Math.sin(t * 0.07) * 0.1;

    // Brillo general según estado (tenue → intenso)
    (pointsRef.current.material as THREE.PointsMaterial).opacity =
      THREE.MathUtils.lerp(0.35, 0.92, stateK / 2);
  });

  return (
    <points
      ref={pointsRef}
      args={[geometry, material]}
      onClick={useCallback(() => onClick?.(), [onClick])}
    />
  );
}
