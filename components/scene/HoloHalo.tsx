"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type Props = {
  status: Status;
  className?: string;
  onClick?: () => void;

  /** Tamaño del contenedor (px). Usa Tailwind arbitrary values, sin CSS inline. */
  sizePx?: number; // default 420

  /** Radio de la esfera (geometría). */
  radius?: number; // default 1.2

  /** Intensidad de glow base (0.2..1.4) */
  glow?: number; // default 0.95
  /** Fuerza de scanlines (0..1) */
  scan?: number; // default 0.55
  /** Frecuencia de “glitch jitter” */
  frequency?: number; // default 6.0
  /** Velocidad de las ondas (latidos) */
  waveSpeed?: number; // default 1.2
  /** Cantidad de ondas simultáneas (1..4) */
  waveCount?: number; // default 2
};

export function HoloHalo({
  status,
  onClick,
  className = "",
  sizePx = 420,
  radius = 1.2,
  glow = 0.95,
  scan = 0.55,
  frequency = 6.0,
  waveSpeed = 1.2,
  waveCount = 2,
}: Props) {
  return (
    <div
      className={[
        "relative rounded-2xl bg-black",
        `w-[${sizePx}px] h-[${sizePx}px]`,
        className,
      ].join(" ")}
    >
      <Canvas
        className="!bg-transparent block"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.2], fov: 34 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <GlitchCore
          status={status}
          onClick={onClick}
          radius={radius}
          glow={glow}
          scan={scan}
          frequency={frequency}
          waveSpeed={waveSpeed}
          waveCount={waveCount}
        />
      </Canvas>
    </div>
  );
}

/* ============================================
 * Núcleo visual (mesh + shaders) – Glitch + Pulse
 * ============================================ */
function GlitchCore({
  status,
  onClick,
  radius,
  glow,
  scan,
  frequency,
  waveSpeed,
  waveCount,
}: {
  status: Status;
  onClick?: () => void;
  radius: number;
  glow: number;
  scan: number;
  frequency: number;
  waveSpeed: number;
  waveCount: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const alive = useAlive();
  useSceneCleanup();

  const geometry = useMemo(
    () => new THREE.SphereGeometry(radius, 160, 120),
    [radius]
  );

  const material = useMemo(() => {
    const vert = /* glsl */ `
      precision highp float;
      varying vec3 vPos;
      uniform float uTime;
      uniform float uFreq;
      void main(){
        vPos = position;
        float wob = sin(vPos.x*uFreq + uTime*1.1)*0.02
                  + sin(vPos.y*uFreq*0.8 - uTime*0.9)*0.02;
        vec3 p = position + normal * wob;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `;

    const frag = /* glsl */ `
      precision highp float;
      varying vec3 vPos;

      uniform float uTime;
      uniform float uState;   // 0=closed,1=connecting,2=open
      uniform float uScan;    // 0..1
      uniform float uGlow;    // 0.2..1.4
      uniform float uFreq;    // frecuencia “eléctrica”
      uniform float uWaveSpd; // velocidad ondas
      uniform float uWaves;   // cantidad de ondas (1..4)

      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p); vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.,0.));
        float c = hash(i + vec2(0.,1.));
        float d = hash(i + vec2(1.,1.));
        vec2 u = f*f*(3.-2.*f);
        return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
      }

      void main(){
        vec3 n = normalize(vPos);

        float stateGlow = mix(0.45, 1.0, uState*0.5);
        float stateScan = mix(0.35, 0.85, uState*0.5);
        float stateGlitch = smoothstep(0.0, 1.0, 1.0 - abs(uState-1.0));

        float rXZ = length(n.xz);
        float spd = mix(0.6, 1.0, uState*0.5) * uWaveSpd;

        float waves = 0.0;
        float count = clamp(uWaves, 1.0, 4.0);
        for (int i=0; i<4; i++) {
          if (float(i) >= count) break;
          float phase = uTime*spd + float(i)*0.9;
          float w = 1.0 - abs(sin(rXZ*8.0 - phase));
          w = smoothstep(0.5, 1.0, w);
          waves += w;
        }
        waves /= count;

        float heartbeat = 0.6 + 0.4 * waves;

        float scan = 0.5 + 0.5 * sin(uTime*1.4 + n.y*32.0);
        scan = pow(scan, 2.0) * uScan * stateScan;

        float jitter = noise(vec2(n.x*8.0 + uTime*1.2, n.y*8.0 - uTime*0.7));
        float ring = smoothstep(0.04, 0.0, abs(rXZ - (0.62 + 0.03*jitter)));

        float hue = fract(0.55 + 0.25*sin(uTime*0.4) + n.y*0.25);
        vec3 cold = hsv2rgb(vec3(hue, 0.9, 1.0));
        vec3 hot  = vec3(0.0, 0.95, 1.0);
        vec3 base = mix(vec3(0.62), cold, smoothstep(0.0,1.0,uState));

        float rim = pow(1.0 - abs(n.z), 2.4) * uGlow * stateGlow;

        vec3 col = base;
        col = mix(col, hot, smoothstep(1.0, 2.0, uState));
        col += rim * vec3(1.0, 0.85, 1.0);
        col += scan * vec3(1.0, 0.8, 1.0);
        col += ring * 0.75 * stateGlitch;

        float alpha = clamp(0.35 + 0.55*heartbeat, 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 1 },
        uScan: { value: scan },
        uGlow: { value: glow },
        uFreq: { value: frequency },
        uWaveSpd: { value: waveSpeed },
        uWaves: { value: waveCount },
        uRadius: { value: radius },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [radius, glow, scan, frequency, waveSpeed, waveCount]);

  const handleClick = useCallback(() => onClick?.(), [onClick]);

  useFrame(({ clock }) => {
    if (!alive.current || !meshRef.current) return;
    const t = clock.getElapsedTime();
    const m = meshRef.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = t;
    m.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;

    meshRef.current.rotation.x = THREE.MathUtils.degToRad(58);
    meshRef.current.rotation.z = t * 0.22;
    meshRef.current.position.y = Math.sin(t * 0.6) * 0.05;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      onClick={handleClick}
    />
  );
}
