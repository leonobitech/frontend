"use client";

import React, { useMemo, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

/* =============================
   Tipos y props públicas
============================= */
export type UIStatus = "open" | "connecting" | "closed";
type Quality = "low" | "med" | "high" | "ultra";
type Props = {
  status: UIStatus;
  onClick?: () => void;
  className?: string;
  quality?: Quality;
};

/* =============================
   Paleta/ritmo por estado
============================= */
function useStatusParams(status: UIStatus) {
  return useMemo(() => {
    if (status === "connecting") {
      return {
        pulseHz: 1.2,
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
        accentColor: new THREE.Color("#8BE9FD"),
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

/* =============================
   Densidades por calidad
============================= */
function countsByQuality(q?: Quality) {
  if (q === "low") return { core: 1400, halo: 2200, sparks: 1600 };
  if (q === "high") return { core: 2600, halo: 4200, sparks: 3200 };
  if (q === "ultra") return { core: 3800, halo: 6400, sparks: 5200 };
  return { core: 2000, halo: 3200, sparks: 2400 }; // med
}

/* =====================================================
   GLSL — sin texturas, punto circular + glow en shader
   - Todo el movimiento ocurre en el VERTEX (GPU)
   - Evitamos loops JS por partícula (adiós tirones)
===================================================== */

const VERT = /* glsl */ `
precision highp float;

attribute float aSeed;   // semilla por partícula [0..1)
attribute float aKind;   // 0 = core, 1 = halo, 2 = sparks
attribute vec3  aBase;   // posición base

uniform float u_time;
uniform float u_pulseHz;
uniform float u_splashPeriod;
uniform float u_splashPower;

uniform vec3 u_coreColor;
uniform vec3 u_accentColor;

// Cámara
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

// hash rápido sin ruido caro
float hash(float n){ return fract(sin(n) * 43758.5453123); }
float n1(float x){ return hash(x); }
float n2(vec2 p){ return fract(43758.5453 * sin(dot(p, vec2(12.9898,78.233)))); }

// swirl/jitter suaves
vec3 swirl(vec3 p, float seed, float t) {
  float s1 = sin(seed * 6.2831 + t * 1.7);
  float s2 = cos(seed * 9.1234 - t * 1.1);
  vec3  j  = vec3(s1 * 0.06, s2 * 0.05, (s1 - s2) * 0.04);
  // leve torsión alrededor del eje Y
  float ang = 0.8 * sin(t * 0.6 + seed * 6.2831);
  float ca = cos(ang), sa = sin(ang);
  mat3 R = mat3(
    ca, 0.0, sa,
    0.0, 1.0, 0.0,
   -sa, 0.0, ca
  );
  return R * (p + j);
}

void main(){
  float t = u_time;

  // latido “eléctrico” sin escalar la escena entera:
  // usamos desplazamiento radial local con media ~0
  float breath = sin(t * 6.2831 * u_pulseHz);
  // splash discreto por período
  float cyc = mod(t, u_splashPeriod);
  float splash = (cyc < 0.18) ? 1.0 : (cyc < 0.55 ? 0.6 : 0.0);
  float sp = u_splashPower * splash;

  // normal radial
  vec3 base = aBase;
  float rl = length(base) + 1e-6;
  vec3 nrm = base / rl;

  // pesos según “kind”
  // core: vibración más suave; halo: más respiración; sparks: reacciona fuerte al splash
  float kCore   = step(aKind, 0.5);          // 1 si 0
  float kHalo   = step(0.5, aKind) * step(aKind, 1.5); // 1 si ~1
  float kSparks = step(1.5, aKind);          // 1 si 2

  float baseAmt   = 0.015 * kCore + 0.020 * kHalo + 0.010 * kSparks;
  float splashAmt = 0.030 * kCore + 0.036 * kHalo + 0.090 * kSparks;

  // jitter y swirl dependientes de semilla
  vec3 p = base;
  p = swirl(p, aSeed, t);

  // desplazamiento radial local (no escala global)
  float j = (sin(aSeed*12.3 + t*2.0) + cos(aSeed*7.7 - t*1.6)) * 0.5;
  float disp = baseAmt * breath + splashAmt * sp * j * 0.35;

  // halo ligeramente elipsoidal al respirar
  if (kHalo > 0.5) {
    p.y *= (1.0 + 0.04 * sin(t * 0.8));
  }

  // sparks salen y vuelven
  if (kSparks > 0.5) {
    p += nrm * (sp * 0.25 + 0.05 * sin(t * 2.4 + aSeed*6.2831));
  }

  // aplicar desplazamiento
  p += nrm * disp;

  // tamaño base por kind (modulado en frag con soft disc)
  float sizeBase = 0.0;
  sizeBase += kCore   * 3.2;
  sizeBase += kHalo   * 2.4;
  sizeBase += kSparks * 2.6;

  // атención: gl_PointSize en pixels (aprox.) — variación pequeña para evitar “zoom”
  float size = sizeBase * (1.0 + 0.08 * breath + 0.12 * sp);
  gl_PointSize = size;

  // posición final
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

uniform vec3 u_coreColor;
uniform vec3 u_accentColor;

// disco suave (sin textura): usa gl_PointCoord
void main(){
  vec2 uv = gl_PointCoord * 2.0 - 1.0;        // [-1..1]
  float r2 = dot(uv, uv);
  if (r2 > 1.0) discard;                      // círculo
  // glow suave: centro brillante → borde fade
  float alpha = smoothstep(1.0, 0.0, r2);
  float glow  = smoothstep(0.9, 0.0, r2);

  // mezcla cromática “eléctrica”
  vec3 c = mix(u_coreColor, u_accentColor, glow);

  gl_FragColor = vec4(c, alpha * (0.75 + 0.25 * glow));
}
`;

/* =========================================
   Capa GPU Points — configurable por “kind”
========================================= */
type MorphicLayerProps = {
  count: number;
  kind: 0 | 1 | 2; // 0 core, 1 halo, 2 sparks
};

function MorphicLayer({ count, kind }: MorphicLayerProps) {
  const alive = useAlive();
  const ptsRef = useRef<THREE.Points>(null);
  const { uCoreColor, uAccentColor, uPulseHz, uSplashPeriod, uSplashPower } =
    useMorphicUniforms();

  // Geometría: base + seed + kind
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();

    // distribución distinta por kind
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const kinds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      kinds[i] = kind;
      seeds[i] = Math.random();

      // distribución:
      // core: esfera comprimida en Y
      // halo: elipsoide amplio
      // sparks: cerca del centro para “salir” en splash
      if (kind === 0) {
        const r = 0.28 + Math.random() * 0.35;
        const a = Math.random() * Math.PI * 2.0;
        const u = Math.acos(2.0 * Math.random() - 1.0);
        const x = r * Math.sin(u) * Math.cos(a);
        const y = r * Math.cos(u) * (0.7 + 0.25 * Math.random());
        const z = r * Math.sin(u) * Math.sin(a);
        positions.set([x, y, z], i * 3);
      } else if (kind === 1) {
        const ax = 1.55,
          ay = 1.12,
          az = 1.45;
        const phi = Math.random() * Math.PI * 2.0;
        const v = Math.random() * 2.0 - 1.0;
        const s = Math.sqrt(1.0 - v * v);
        const r = 1.0 + 0.18 * (Math.random() - 0.5);
        const x = ax * r * s * Math.cos(phi);
        const y = ay * r * v;
        const z = az * r * s * Math.sin(phi);
        positions.set([x, y, z], i * 3);
      } else {
        const r = 0.05 + Math.random() * 0.18;
        const a = Math.random() * Math.PI * 2.0;
        const u = Math.acos(2.0 * Math.random() - 1.0);
        const x = r * Math.sin(u) * Math.cos(a);
        const y = r * Math.cos(u);
        const z = r * Math.sin(u) * Math.sin(a);
        positions.set([x, y, z], i * 3);
      }
    }

    g.setAttribute("aBase", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
    g.setAttribute("aKind", new THREE.Float32BufferAttribute(kinds, 1));
    return g;
  }, [count, kind]);

  // Material shader (sin any, uniforms tipados)
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      uniforms: {
        u_time: { value: 0 },
        u_pulseHz: { value: 0.8 },
        u_splashPeriod: { value: 3.0 },
        u_splashPower: { value: 0.6 },
        u_coreColor: { value: new THREE.Color("#22D3EE") },
        u_accentColor: { value: new THREE.Color("#7DD3FC") },
      },
    });
    return m;
  }, []);

  // Sincronizar uniforms con estado externo
  useEffect(() => {
    mat.uniforms.u_pulseHz.value = uPulseHz;
    mat.uniforms.u_splashPeriod.value = uSplashPeriod;
    mat.uniforms.u_splashPower.value = uSplashPower;
    mat.uniforms.u_coreColor.value.copy(uCoreColor);
    mat.uniforms.u_accentColor.value.copy(uAccentColor);
  }, [mat, uPulseHz, uSplashPeriod, uSplashPower, uCoreColor, uAccentColor]);

  // Avanzar tiempo — nada de loops por partícula en JS
  useFrame(({ clock }) => {
    if (!alive.current) return;
    mat.uniforms.u_time.value = clock.elapsedTime;
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
   Hook uniforms derivados del status
========================================= */
function useMorphicUniforms() {
  const { pulseHz, splashPeriod, splashPower, coreColor, accentColor } =
    useStatusParams(React.useContext(StatusCtx));

  // valores tipados sin any
  const uCoreColor = useMemo(() => coreColor.clone(), [coreColor]);
  const uAccentColor = useMemo(() => accentColor.clone(), [accentColor]);

  return {
    uPulseHz: pulseHz,
    uSplashPeriod: splashPeriod,
    uSplashPower: splashPower,
    uCoreColor,
    uAccentColor,
  };
}

/* =========================================
   Contexto de status para hijos
========================================= */
const StatusCtx = React.createContext<UIStatus>("closed");

/* =========================================
   Escena raíz — renderer y capas
========================================= */
function SceneRoot({
  status,
  quality,
}: {
  status: UIStatus;
  quality?: Quality;
}) {
  const { gl, scene, camera } = useThree();
  useSceneCleanup();

  const { core, halo, sparks } = countsByQuality(quality);

  useEffect(() => {
    scene.background = null;
    camera.position.set(0, 0, 3.6);
    const r = gl as THREE.WebGLRenderer;
    r.setClearAlpha(0);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }, [gl, scene, camera]);

  return (
    <StatusCtx.Provider value={status}>
      {/* luz muy tenue para reflejos en caso de añadir geometría futura */}
      <ambientLight intensity={0.2} />
      <pointLight position={[2, 2, 3]} intensity={0.9} />
      <pointLight position={[-2, -2, -3]} intensity={0.5} />

      {/* Orden: núcleo, halo, chispas */}
      <MorphicLayer count={core} kind={0} />
      <MorphicLayer count={halo} kind={1} />
      <MorphicLayer count={sparks} kind={2} />
    </StatusCtx.Provider>
  );
}

/* =========================================
   Componente público (mismo nombre/props)
========================================= */
export function CosmicBioCore({
  status,
  onClick,
  className,
  quality = "med",
}: Props) {
  const handleClick = useCallback(() => onClick?.(), [onClick]);

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
        <SceneRoot status={status} quality={quality} />
      </Canvas>
    </button>
  );
}
