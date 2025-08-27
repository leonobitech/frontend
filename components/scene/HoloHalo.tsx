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

  // Focus pulse: simula acercar/alejar sin cambiar el tamaño de cada punto
  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const k = status === "closed" ? 0 : status === "connecting" ? 1 : 2;
    const amp = THREE.MathUtils.lerp(0.04, 0.1, k / 2);
    const s = 1.0 + amp * Math.sin(t * (0.75 + 0.25 * k));
    g.scale.setScalar(s);
  });

  return (
    <group ref={root}>
      <WireCore status={status} />
      <ParticleNebula status={status} onClick={onClick} />
      <CoreSparks status={status} />
    </group>
  );
}

/* ========================== WIREFRAME FUTURISTA ========================= */
function WireCore({ status }: { status: Status }) {
  const mesh = useRef<THREE.LineSegments>(null);

  const geo = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(0.55, 0);
    const edges = new THREE.EdgesGeometry(base);
    return edges;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0x00eaff,
        transparent: true,
        opacity: 0.65,
      }),
    []
  );

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.getElapsedTime();
    const k = status === "closed" ? 0 : status === "connecting" ? 1 : 2;
    m.rotation.x = 0.6;
    m.rotation.y = t * (0.15 + 0.05 * k);
    (m.material as THREE.LineBasicMaterial).opacity = THREE.MathUtils.lerp(
      0.35,
      0.75,
      k / 2
    );
  });

  return <lineSegments ref={mesh} geometry={geo} material={mat} />;
}

/* ============================== NEBULOSA =============================== */
function ParticleNebula({
  status,
  onClick,
}: {
  status: Status;
  onClick?: () => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));

  // Más partículas pero más chicas → “polvo” fino
  const COUNT = isMobile ? 3000 : 5200;
  const RADIUS = 1.35;
  const POINT_SIZE_WORLD = isMobile ? 0.02 : 0.022;

  // Textura circular (disco con alpha suave)
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
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, []);

  // Geometría con sesgo fuerte al núcleo
  const { geometry, basePositions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const rMin = 0.05; // core compacto
      const bias = 3.2; // ↑ más puntos cerca del centro
      const r = RADIUS * (rMin + (1.0 - rMin) * Math.pow(Math.random(), bias));
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry, basePositions: positions, seeds };
  }, [COUNT, RADIUS]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: POINT_SIZE_WORLD,
        sizeAttenuation: true,
        map: circleTex,
        alphaMap: circleTex,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color(0x00eaff),
        opacity: 0.88,
      }),
    [POINT_SIZE_WORLD, circleTex]
  );

  useFrame(({ clock }) => {
    const pts = pointsRef.current;
    if (!pts) return;

    const t = clock.getElapsedTime();
    const arr = pts.geometry.attributes.position.array as Float32Array;

    const k = status === "closed" ? 0 : status === "connecting" ? 1 : 2;
    const pulseAmp = THREE.MathUtils.lerp(0.02, 0.06, k / 2);
    const pulseSpd = 0.9 + 0.4 * k;

    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const f = 1.0 + pulseAmp * Math.sin(t * pulseSpd + s * 6.28318);
      arr[i * 3 + 0] = basePositions[i * 3 + 0] * f;
      arr[i * 3 + 1] = basePositions[i * 3 + 1] * f;
      arr[i * 3 + 2] = basePositions[i * 3 + 2] * f;
    }
    pts.geometry.attributes.position.needsUpdate = true;

    pts.rotation.y = t * 0.1;
    pts.rotation.x = Math.sin(t * 0.06) * 0.08;

    (pts.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp(
      0.42,
      0.94,
      k / 2
    );
  });

  return (
    <points
      ref={pointsRef}
      args={[geometry, material]}
      onClick={useCallback(() => onClick?.(), [onClick])}
    />
  );
}

/* ============================== CHISPAS CORE ============================= */
function CoreSparks({ status }: { status: Status }) {
  const ref = useRef<THREE.Points>(null);

  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
  const SPARKS = isMobile ? 20 : 36;

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
    g.addColorStop(0.7, "rgba(255,255,255,0.25)");
    g.addColorStop(1.0, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cvs);
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, []);

  const { geo, base, phase } = useMemo(() => {
    const pos = new Float32Array(SPARKS * 3);
    const pha = new Float32Array(SPARKS);
    for (let i = 0; i < SPARKS; i++) {
      const u = Math.random(),
        v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 0.08 + Math.random() * 0.14;
      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      pha[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, base: pos, phase: pha };
  }, [SPARKS]);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: isMobile ? 0.05 : 0.065,
        sizeAttenuation: true,
        map: circleTex,
        alphaMap: circleTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color(0xffffff),
        opacity: 1,
      }),
    [circleTex, isMobile]
  );

  useFrame(({ clock }) => {
    const p = ref.current;
    if (!p) return;

    const t = clock.getElapsedTime();
    const k = status === "closed" ? 0 : status === "connecting" ? 1 : 2;
    const arr = p.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < SPARKS; i++) {
      const i3 = i * 3;
      const ph = phase[i];
      const rj = 0.02 + 0.05 * Math.sin(t * 3.0 + ph * 12.0);
      const ang = t * (1.2 + 0.3 * k) + ph * Math.PI * 2.0;
      arr[i3 + 0] = base[i3 + 0] + Math.cos(ang) * rj;
      arr[i3 + 1] = base[i3 + 1] + Math.sin(ang * 0.9) * (rj * 0.5);
      arr[i3 + 2] = base[i3 + 2] + Math.sin(ang) * rj;
    }
    p.geometry.attributes.position.needsUpdate = true;

    (p.material as THREE.PointsMaterial).opacity =
      THREE.MathUtils.lerp(0.5, 1.0, k / 2) * (0.85 + 0.15 * Math.sin(t * 8.0));
  });

  return <points ref={ref} args={[geo, mat]} />;
}
