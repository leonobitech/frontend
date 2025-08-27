"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export type Status = "open" | "connecting" | "closed";

type Props = {
  status: Status;
  onClick?: () => void;
  // todo lo demás interno con defaults seguros
  sizePx?: number; // opcional, por si querés tocar
  resolution?: number; // N por lado (N*N puntos)
  radius?: number;
  pointSize?: number;
};

export function HoloHalo({
  status,
  onClick,
  sizePx = 420,
  resolution = 200, // densidad razonable
  radius = 1.15,
  pointSize = 1.1, // 👈 más chico para que se vean “puntos”
}: Props) {
  return (
    <div
      className={[
        "relative rounded-full overflow-hidden",
        `w-[${sizePx}px] h-[${sizePx}px]`,
      ].join(" ")}
    >
      <Canvas
        className="!bg-transparent block"
        dpr={[1, 1.25]} // cap para móvil
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
        <EnergyCore
          status={status}
          onClick={onClick}
          resolution={resolution}
          radius={radius}
          pointSize={pointSize}
        />
      </Canvas>
    </div>
  );
}

/* ================= Energy Core v2: puntos visibles de verdad 😎 ================ */
function EnergyCore({
  status,
  onClick,
  resolution,
  radius,
  pointSize,
}: {
  status: Status;
  onClick?: () => void;
  resolution: number;
  radius: number;
  pointSize: number;
}) {
  const ptsRef = useRef<THREE.Points>(null!);
  const N = resolution;

  // Geometría: grilla UV (no ponemos posiciones, las calcula el VS)
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = N * N;
    const pos = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    let i = 0,
      j = 0;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        pos[i++] = 0;
        pos[i++] = 0;
        pos[i++] = 0;
        uvs[j++] = (x + 0.5) / N;
        uvs[j++] = (y + 0.5) / N;
      }
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return g;
  }, [N]);

  const mat = useMemo(() => {
    const vert = /* glsl */ `
      precision highp float;
      varying float vHash;    // para descarte/ruido en FS
      varying vec3  vCol;

      uniform float uTime;
      uniform float uState;   // 0,1,2
      uniform float uRadius;
      uniform float uPointSize;

      // hash determinista por uv (barato)
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      vec2  hash2(vec2 p){ return vec2(hash(p), hash(p+0.37)); }

      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      void main(){
        // esfera paramétrica
        float th = 6.2831853 * uv.x;                 // theta
        float ph = acos(2.0*uv.y - 1.0);             // phi
        vec3 n = vec3(sin(ph)*cos(th), cos(ph), sin(ph)*sin(th));

        // grosor de la capa (espesor) -> separa partículas para que no “sellen”
        vec2 j2 = hash2(uv);
        float shell = (j2.x - 0.5) * 0.14;           // ± espesor
        // latido
        float beat = 0.5 + 0.5 * sin(uTime * mix(0.8, 1.6, uState*0.5));
        float r = uRadius * (0.92 + 0.06*beat) + shell;

        // flujo simple: giro + ondulación
        float wob = 0.04 * sin(uTime*1.2 + j2.y*20.0 + th*2.0);
        vec3 p = n * (r + wob);

        // rotación global
        float t = uTime * 0.22;
        mat2 R = mat2(cos(t), -sin(t), sin(t), cos(t));
        p.xz = R * p.xz;

        // salida clip
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        // color holográfico
        float hue = fract(0.55 + 0.25*sin(uTime*0.6) + n.y*0.25);
        vec3 cold = hsv2rgb(vec3(hue, 0.95, 1.0));
        vec3 hot  = vec3(0.0, 0.95, 1.0);
        vCol = mix(cold, hot, smoothstep(1.0, 2.0, uState));

        // tamaño -> más pequeño para que no tapice
        float factor = mix(0.85, 1.35, smoothstep(1.0, 2.0, uState));
        gl_PointSize = uPointSize * factor * (300.0 / -mv.z);

        // hash para descarte/centelleo en FS
        vHash = hash(uv + 0.13*vec2(sin(uTime), cos(uTime*0.7)));
      }
    `;

    const frag = /* glsl */ `
      precision highp float;
      varying float vHash;
      varying vec3  vCol;

      void main(){
        vec2 q = gl_PointCoord*2.0 - 1.0;
        float d = dot(q,q);
        if (d > 1.0) discard;

        // DENSIDAD: descartamos ~35% de partículas (evita “bloque sólido”)
        if (vHash < 0.35) discard;

        // borde suave + alpha real de partícula
        float fall = smoothstep(1.0, 0.0, d);              // 1 en centro, 0 en borde
        float rim  = smoothstep(0.95, 0.0, d);             // halo
        vec3 col = vCol * (0.55 + 0.45*rim);

        // chispa leve por aleatorio
        col += smoothstep(0.92, 1.0, vHash) * 0.25;

        float alpha = fall * 0.85;                         // alpha bajo = “puntos”
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 1 },
        uRadius: { value: radius },
        uPointSize: { value: pointSize },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [radius, pointSize]);

  useFrame(({ clock }) => {
    if (!ptsRef.current) return;
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
