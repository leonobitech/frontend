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
  /** Tamaño del contenedor (px) — usa Tailwind arbitrary values */
  sizePx?: number; // default 420
  /** Cantidad por lado (N*N puntos) */
  resolution?: number; // default 256 (~65k)
  /** Radio visual de la esfera */
  radius?: number; // default 1.25
  /** Velocidad del flujo */
  speed?: number; // default 1.0
  /** Tamaño base del punto */
  pointSize?: number; // default 1.7
};

export function HoloHalo({
  status,
  onClick,
  className = "",
  sizePx = 420,
  resolution = 256,
  radius = 1.25,
  speed = 1.0,
  pointSize = 1.7,
}: Props) {
  return (
    <div
      className={[
        "relative rounded-full overflow-hidden", // máscara circular
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
        <ParticleSphere
          status={status}
          onClick={onClick}
          resolution={resolution}
          radius={radius}
          speed={speed}
          pointSize={pointSize}
        />
      </Canvas>
    </div>
  );
}

/* ============================================================================
 * Núcleo: puntos procedurales sobre esfera + flujo “envolvente” (sin FBO)
 * ============================================================================
 */
function ParticleSphere({
  status,
  onClick,
  resolution,
  radius,
  speed,
  pointSize,
}: {
  status: Status;
  onClick?: () => void;
  resolution: number;
  radius: number;
  speed: number;
  pointSize: number;
}) {
  useSceneCleanup();
  const alive = useAlive();
  const ptsRef = useRef<THREE.Points>(null!);

  const N = resolution;

  // Geometría: N*N puntos con uv regular (0..1)
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = N * N;
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    let i = 0,
      j = 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        positions[i++] = 0;
        positions[i++] = 0;
        positions[i++] = 0;
        uvs[j++] = (x + 0.5) / N;
        uvs[j++] = (y + 0.5) / N;
      }
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return g;
  }, [N]);

  const mat = useMemo(() => {
    // Vertex Shader: esfera paramétrica + flujo curl-like + latido
    const vert = /* glsl */ `
      precision highp float;
      // 'uv' viene de la geometría (Three lo inyecta); NO volver a declararlo.
      varying float vDepth;
      varying float vSpark;
      varying vec3  vCol;

      uniform float uTime;
      uniform float uState;     // 0=closed,1=connecting,2=open
      uniform float uRadius;
      uniform float uSpeed;
      uniform float uPointSize;

      // ---- util ----
      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      // Value noise 3D (simple y barato)
      float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
      float noise(vec3 p){
        vec3 i=floor(p), f=fract(p);
        float n = dot(i, vec3(1.0,57.0,113.0));
        vec3 u = f*f*(3.0-2.0*f);
        float a = hash(vec3(n+0.0, n+0.0, n+0.0));
        float b = hash(vec3(n+1.0, n+0.0, n+0.0));
        float c = hash(vec3(n+57.0, n+0.0, n+0.0));
        float d = hash(vec3(n+58.0, n+0.0, n+0.0));
        float e = hash(vec3(n+113.0, n+0.0, n+0.0));
        float f2= hash(vec3(n+114.0, n+0.0, n+0.0));
        float g = hash(vec3(n+170.0, n+0.0, n+0.0));
        float h = hash(vec3(n+171.0, n+0.0, n+0.0));
        float x = mix(a,b,u.x), y = mix(c,d,u.x), z = mix(e,f2,u.x), w = mix(g,h,u.x);
        return mix(mix(x,y,u.y), mix(z,w,u.y), u.z);
      }

      // Curl aproximado a partir de noise escalar
      vec3 curl(vec3 p){
        float e=0.12;
        float n1=noise(p+vec3( e,0,0)), n2=noise(p+vec3(-e,0,0));
        float n3=noise(p+vec3(0, e,0)), n4=noise(p+vec3(0,-e,0));
        float n5=noise(p+vec3(0,0, e)), n6=noise(p+vec3(0,0,-e));
        vec3 c=vec3(n4-n3, n1-n2, n6-n5)/(2.0*e);
        return normalize(c+1e-5);
      }

      void main(){
        // Parametrización de esfera desde uv
        float u = uv.x;                  // 0..1
        float v = uv.y;                  // 0..1
        float theta = 6.2831853 * u;     // 0..2π
        float phi   = acos(2.0*v - 1.0); // 0..π
        vec3 base = vec3(
          sin(phi)*cos(theta),
          cos(phi),
          sin(phi)*sin(theta)
        );

        // Estados -> intensidades
        float kSpeed = mix(0.3, 1.0, uState*0.5);
        float kSpark = smoothstep(0.0, 1.0, uState); // más chispa cuando no está cerrado

        // Latido radial
        float beat = 0.5 + 0.5 * sin(uTime * mix(0.8, 1.6, uState*0.5));
        float r    = uRadius * (0.88 + 0.08*beat);

        // Flujo (curl) sobre la superficie
        // Proyectamos el campo curl y lo mezclamos con un vórtice suave
        vec3 p0 = base * r;
        vec3 fld = curl(p0*0.9 + vec3(0.0, uTime*0.25, 0.0));
        vec3 tangent = normalize(fld - dot(fld, base)*base); // tangente sobre la esfera
        vec3 vortex = normalize(vec3(-base.z, 0.0, base.x));
        vec3 flow = normalize(tangent*0.7 + vortex*0.3);

        // desplazamiento “envolvente” (hace orbitar y ondular)
        float w = (0.8 + 0.2*sin(uTime*0.7 + dot(base, vec3(3.0,2.0,1.0))));
        vec3 pos = p0 + flow * w * (0.08 * uSpeed * kSpeed);

        // pose general (inclinación + rotación lenta)
        float t = uTime * 0.22;
        mat2 R = mat2(cos(t), -sin(t), sin(t), cos(t));
        pos.xz = R * pos.xz;

        // Salida espacio clip
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;

        // Tamaño y chispa por “actividad” del campo
        float curlMag = length(fld);
        float speedSpark = smoothstep(0.8, 1.4, curlMag);
        float factor = mix(0.8, 1.5, smoothstep(1.0, 2.0, uState));
        float sizeBoost = mix(1.0, 1.7, speedSpark*kSpark);
        gl_PointSize = uPointSize * factor * sizeBoost * (300.0 / -mv.z);

        // Color base: holográfico + depth
        vDepth = normalize(pos).z;
        float hue = fract(0.55 + 0.25*sin(uTime*0.6) + vDepth*0.25);
        vec3 cold = hsv2rgb(vec3(hue, 0.95, 1.0));
        vec3 hot  = vec3(0.0, 0.95, 1.0);
        vCol = mix(cold, hot, smoothstep(1.0, 2.0, uState));
        vSpark = speedSpark*kSpark;
      }
    `;

    // Fragment Shader: disco suave + brillo por chispa
    const frag = /* glsl */ `
      precision highp float;
      varying float vDepth;
      varying float vSpark;
      varying vec3  vCol;

      void main(){
        vec2 q = gl_PointCoord*2.0 - 1.0;
        float d = dot(q,q);
        if (d > 1.0) discard;

        float ring = smoothstep(0.95, 0.0, d);
        vec3 col = vCol * (0.55 + 0.45*ring);
        col += vSpark * 0.6; // chispa blanca sutil

        float alpha = (1.0 - d) * (0.65 + 0.35*vSpark);
        gl_FragColor = vec4(col, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 1 }, // 0 / 1 / 2
        uRadius: { value: radius },
        uSpeed: { value: speed },
        uPointSize: { value: pointSize },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [radius, speed, pointSize]);

  useFrame(({ clock }) => {
    if (!alive.current || !ptsRef.current) return;
    const t = clock.getElapsedTime();
    const m = ptsRef.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = t;
    m.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;
  });

  return (
    <points
      ref={ptsRef}
      geometry={geom}
      material={mat}
      onClick={useCallback(() => onClick?.(), [onClick])}
    />
  );
}
