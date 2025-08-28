"use client";

import React, { useMemo, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

/* =========================================
   Tipos y props públicas
========================================= */
export type UIStatus = "open" | "connecting" | "closed";
type Quality = "low" | "med" | "high" | "ultra";

type Props = {
  status: UIStatus;
  onClick?: () => void;
  className?: string;
  quality?: Quality;
  useMic?: boolean; // activa mic interno (si no pasás externalLevel)
  externalLevel?: number; // nivel 0..1 calculado desde afuera (tu página)
};

/* =========================================
   Paleta / ritmo por estado
========================================= */
function useStatusParams(status: UIStatus) {
  return useMemo(() => {
    if (status === "connecting") {
      return {
        pulseHz: 1.15,
        splashPeriod: 2.1,
        splashPower: 1.0,
        coreColor: new THREE.Color("#1EE9FF"),
        accentColor: new THREE.Color("#FFB86B"),
      };
    }
    if (status === "open") {
      return {
        pulseHz: 0.7,
        splashPeriod: 4.0,
        splashPower: 0.6,
        coreColor: new THREE.Color("#22D3EE"),
        accentColor: new THREE.Color("#7DD3FC"),
      };
    }
    return {
      pulseHz: 0.25,
      splashPeriod: 999.0,
      splashPower: 0.15,
      coreColor: new THREE.Color("#94A3B8"),
      accentColor: new THREE.Color("#CBD5E1"),
    };
  }, [status]);
}

/* =========================================
   Resoluciones según calidad
========================================= */
function countsByQuality(q?: Quality) {
  if (q === "low") return { ribbonL: 120, ribbonW: 14, sparks: 1200 };
  if (q === "high") return { ribbonL: 220, ribbonW: 22, sparks: 2600 };
  if (q === "ultra") return { ribbonL: 320, ribbonW: 26, sparks: 4200 };
  return { ribbonL: 180, ribbonW: 18, sparks: 1800 }; // "med"
}

/* =========================================
   Hook de micrófono interno (si se usa)
========================================= */
function useMicLevel(enabled: boolean): number {
  const levelRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    let ctx: AudioContext | null = null;
    let raf = 0;

    (async () => {
      try {
        const AudioContextCtor: { new (): AudioContext } =
          "AudioContext" in window
            ? window.AudioContext
            : (
                window as unknown as {
                  webkitAudioContext: { new (): AudioContext };
                }
              ).webkitAudioContext;

        ctx = new AudioContextCtor();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        analyserRef.current = analyser;

        // Tipado que evita TS2345 con lib.dom.d.ts
        dataRef.current = new Uint8Array(
          analyser.frequencyBinCount
        ) as unknown as Uint8Array<ArrayBuffer>;

        const loop = () => {
          if (!mounted || !analyserRef.current || !dataRef.current) return;

          analyserRef.current.getByteFrequencyData(dataRef.current);
          let sum = 0;
          const arr = dataRef.current;
          const n = arr.length;
          for (let i = 0; i < n; i++) sum += arr[i] * arr[i];
          const rms = Math.sqrt(sum / n) / 255; // 0..1
          levelRef.current = levelRef.current * 0.85 + rms * 0.15;

          raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);
      } catch {
        // sin permiso → queda en 0
      }
    })();

    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
      try {
        ctx?.close();
      } catch {
        /* noop */
      }
      analyserRef.current = null;
      dataRef.current = null;
    };
  }, [enabled]);

  return levelRef.current;
}

/* =========================================
   Shaders — Ribbon + Sparks (GPU)
========================================= */

// Vertex shader — cinta mórfica
const RIBBON_VERT = /* glsl */ `
precision highp float;

attribute float aS;  // [0..1] largo
attribute float aU;  // [-1..1] ancho

uniform float u_time;
uniform float u_pulseHz;
uniform float u_splashPeriod;
uniform float u_splashPower;
uniform float u_level;
uniform float u_eps;
uniform vec3  u_coreColor;
uniform vec3  u_accentColor;

// OJO: NO declarar projectionMatrix / modelViewMatrix aquí.
// Three.js los proporciona automáticamente.

vec3 centerPath(float s, float t) {
  float R = 1.15 + 0.20 * sin(6.2831 * s + t * 0.6)
                  + 0.12 * sin(6.2831 * s * 2.0 - t * 0.9);
  float ang = 6.2831 * s * (1.0 + 0.15 * sin(t * 0.5));
  float x = R * cos(ang);
  float z = R * sin(ang);
  float y = 0.35 * sin(ang * 0.5 + t * 0.8);
  return vec3(x, y, z);
}

vec3 safeNorm(vec3 v){ float l = length(v); return (l > 1e-6) ? v/l : vec3(0.0,1.0,0.0); }

void main() {
  float t = u_time;

  float breath = sin(6.2831 * u_pulseHz * t);
  float cyc = mod(t, u_splashPeriod);
  float splash = (cyc < 0.18) ? 1.0 : (cyc < 0.55 ? 0.6 : 0.0);
  float sp = u_splashPower * splash;

  vec3 c0 = centerPath(aS, t);
  vec3 c1 = centerPath(min(1.0, aS + u_eps), t);
  vec3 T = safeNorm(c1 - c0);
  vec3 U = vec3(0.0, 1.0, 0.0);
  vec3 N = safeNorm(cross(T, U));
  vec3 B = safeNorm(cross(T, N));

  float thicknessBase = 0.08 + 0.06 * (1.0 - pow(aS, 1.4));
  float thickness = thicknessBase * (1.0 + 0.25 * u_level + 0.18 * sp + 0.10 * breath);

  float wob = 0.04 * sin(6.2831 * (aS * 1.7 + aU * 0.5) + t * 1.6)
            + 0.02 * cos(6.2831 * (aS * 2.3 - aU * 0.7) - t * 1.2);

  vec3 pos = c0 + (aU * thickness) * N + wob * B;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

// Fragment — gradiente multicolor
const RIBBON_FRAG = /* glsl */ `
precision highp float;
uniform float u_time;
uniform vec3  u_coreColor;
uniform vec3  u_accentColor;

void main() {
  float t = u_time;
  float k = 0.5 + 0.5 * sin(gl_FragCoord.x * 0.01 + t * 0.9);
  vec3 col = mix(u_coreColor, u_accentColor, k);
  gl_FragColor = vec4(col, 0.86);
}
`;

// Sparks (partículas)
const SPARKS_VERT = /* glsl */ `
precision highp float;

attribute vec3 aBase;
attribute float aSeed;

uniform float u_time;
uniform float u_pulseHz;
uniform float u_splashPeriod;
uniform float u_splashPower;
uniform float u_level;

// NO declarar projectionMatrix / modelViewMatrix aquí.

vec3 swirl(vec3 p, float seed, float t) {
  float s1 = sin(seed * 6.2831 + t * 1.7);
  float s2 = cos(seed * 9.1234 - t * 1.1);
  vec3 j  = vec3(s1 * 0.18, s2 * 0.16, (s1 - s2) * 0.14);
  float ang = 0.9 * sin(t * 0.8 + seed * 6.2831);
  float ca = cos(ang), sa = sin(ang);
  mat3 R = mat3(
    ca, 0.0, sa,
    0.0, 1.0, 0.0,
   -sa, 0.0, ca
  );
  return R * (p + j);
}

void main() {
  float t = u_time;
  float breath = sin(6.2831 * u_pulseHz * t);
  float cyc = mod(t, u_splashPeriod);
  float splash = (cyc < 0.18) ? 1.0 : (cyc < 0.55 ? 0.6 : 0.0);
  float sp = u_splashPower * splash;

  vec3 p = swirl(aBase, aSeed, t);
  vec3 nrm = normalize(aBase + vec3(1e-6));
  p += nrm * (0.25 * sp + 0.18 * u_level + 0.06 * breath);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = 3.0 * (1.0 + 0.08 * breath + 0.12 * sp + 0.15 * u_level);
}
`;

const SPARKS_FRAG = /* glsl */ `
precision highp float;
uniform vec3 u_coreColor;
uniform vec3 u_accentColor;

void main(){
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(uv, uv);
  if (r2 > 1.0) discard;
  float alpha = smoothstep(1.0, 0.0, r2);
  float glow  = smoothstep(0.85, 0.0, r2);
  vec3 col = mix(u_coreColor, u_accentColor, glow);
  gl_FragColor = vec4(col, alpha);
}
`;

/* =========================================
   Malla ribbon y partículas sparks
========================================= */
function AuroraRibbon({
  L,
  W,
  uParams,
}: {
  L: number;
  W: number;
  uParams: {
    pulseHz: number;
    splashPeriod: number;
    splashPower: number;
    coreColor: THREE.Color;
    accentColor: THREE.Color;
    level: number;
  };
}) {
  const alive = useAlive();
  const meshRef =
    useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);

  const geom = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts = (L + 1) * (W + 1);
    const pos = new Float32Array(verts * 3);
    const aS = new Float32Array(verts);
    const aU = new Float32Array(verts);

    let i = 0;
    for (let iy = 0; iy <= W; iy++) {
      const u = -1 + (2 * iy) / W;
      for (let ix = 0; ix <= L; ix++) {
        const s = ix / L;
        const idx = i++;
        aS[idx] = s;
        aU[idx] = u;
      }
    }

    const indices: number[] = [];
    for (let iy = 0; iy < W; iy++) {
      for (let ix = 0; ix < L; ix++) {
        const a = iy * (L + 1) + ix;
        const b = a + 1;
        const c = (iy + 1) * (L + 1) + ix;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("aS", new THREE.Float32BufferAttribute(aS, 1));
    geo.setAttribute("aU", new THREE.Float32BufferAttribute(aU, 1));
    geo.setIndex(indices);
    return geo;
  }, [L, W]);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: RIBBON_VERT,
      fragmentShader: RIBBON_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        u_time: { value: 0 },
        u_pulseHz: { value: uParams.pulseHz },
        u_splashPeriod: { value: uParams.splashPeriod },
        u_splashPower: { value: uParams.splashPower },
        u_level: { value: uParams.level },
        u_eps: { value: 1 / Math.max(1, L) },
        u_coreColor: { value: uParams.coreColor.clone() },
        u_accentColor: { value: uParams.accentColor.clone() },
      },
    });
  }, [L, uParams]);

  useFrame(({ clock }) => {
    if (!alive.current || !meshRef.current) return;
    const { uniforms } = meshRef.current.material;
    uniforms.u_time.value = clock.elapsedTime;
    uniforms.u_pulseHz.value = uParams.pulseHz;
    uniforms.u_splashPeriod.value = uParams.splashPeriod;
    uniforms.u_splashPower.value = uParams.splashPower;
    uniforms.u_level.value = uParams.level;
    (uniforms.u_coreColor.value as THREE.Color).copy(uParams.coreColor);
    (uniforms.u_accentColor.value as THREE.Color).copy(uParams.accentColor);
  });

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  return <mesh ref={meshRef} geometry={geom} material={mat} />;
}

function Sparks({
  count,
  uParams,
}: {
  count: number;
  uParams: {
    pulseHz: number;
    splashPeriod: number;
    splashPower: number;
    coreColor: THREE.Color;
    accentColor: THREE.Color;
    level: number;
  };
}) {
  const alive = useAlive();
  const ptsRef =
    useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const base = new Float32Array(count * 3);
    const seed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      seed[i] = Math.random();
      const r = 1.2 * Math.cbrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(v) * Math.cos(a);
      const y = r * Math.cos(v) * 0.9;
      const z = r * Math.sin(v) * Math.sin(a);
      base[i * 3 + 0] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
    }

    g.setAttribute("aBase", new THREE.Float32BufferAttribute(base, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: SPARKS_VERT,
      fragmentShader: SPARKS_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        u_time: { value: 0 },
        u_pulseHz: { value: uParams.pulseHz },
        u_splashPeriod: { value: uParams.splashPeriod },
        u_splashPower: { value: uParams.splashPower },
        u_level: { value: uParams.level },
        u_coreColor: { value: uParams.coreColor.clone() },
        u_accentColor: { value: uParams.accentColor.clone() },
      },
    });
  }, [uParams]);

  useFrame(({ clock }) => {
    if (!alive.current || !ptsRef.current) return;
    const { uniforms } = ptsRef.current.material;
    uniforms.u_time.value = clock.elapsedTime;
    uniforms.u_pulseHz.value = uParams.pulseHz;
    uniforms.u_splashPeriod.value = uParams.splashPeriod;
    uniforms.u_splashPower.value = uParams.splashPower;
    uniforms.u_level.value = uParams.level;
    (uniforms.u_coreColor.value as THREE.Color).copy(uParams.coreColor);
    (uniforms.u_accentColor.value as THREE.Color).copy(uParams.accentColor);
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
   Escena raíz — renderer + capas
========================================= */
function SceneRoot({
  status,
  quality,
  level,
}: {
  status: UIStatus;
  quality?: Quality;
  level: number;
}) {
  const { gl, scene, camera } = useThree();
  useSceneCleanup();

  const { ribbonL, ribbonW, sparks } = countsByQuality(quality);
  const { pulseHz, splashPeriod, splashPower, coreColor, accentColor } =
    useStatusParams(status);

  useEffect(() => {
    scene.background = null;
    camera.position.set(0, 0, 3.6);
    const r = gl as THREE.WebGLRenderer;
    r.setClearAlpha(0);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }, [gl, scene, camera]);

  const uParams = useMemo(
    () => ({
      pulseHz,
      splashPeriod,
      splashPower,
      coreColor,
      accentColor,
      level,
    }),
    [pulseHz, splashPeriod, splashPower, coreColor, accentColor, level]
  );

  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[2, 2, 3]} intensity={0.8} />
      <pointLight position={[-2, -2, -3]} intensity={0.4} />

      <AuroraRibbon L={ribbonL} W={ribbonW} uParams={uParams} />
      <Sparks count={sparks} uParams={uParams} />
    </>
  );
}

/* =========================================
   Componente público
========================================= */
export function CosmicBioCore({
  status,
  onClick,
  className,
  quality = "med",
  useMic = false,
  externalLevel,
}: Props) {
  const handleClick = useCallback(() => onClick?.(), [onClick]);

  // Hook siempre llamado (sin condicionales) — queda en 0 si useMic=false
  const internalMicLevel = useMicLevel(useMic);

  // Fallback suave por estado si no hay mic
  const fallbackLevel =
    status === "connecting" ? 0.6 : status === "open" ? 0.25 : 0.0;

  // Prioridad: externalLevel ▸ useMic ▸ fallback
  const level =
    typeof externalLevel === "number"
      ? externalLevel
      : useMic
      ? internalMicLevel
      : fallbackLevel;

  return (
    <button
      type="button"
      aria-label={status === "open" ? "Desconectar" : "Conectando"}
      onClick={handleClick}
      className={[
        "relative block",
        "w-[56vmin] h-[56vmin] max-w-[360px] max-h-[360px] min-w-[240px] min-h-[240px]",
        "appearance-none bg-transparent border-0 p-0 m-0",
        "outline-none focus:outline-none focus:ring-0 ring-0",
        className || "",
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
        <SceneRoot status={status} quality={quality} level={level} />
      </Canvas>
    </button>
  );
}
