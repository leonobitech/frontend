"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export type Status = "open" | "connecting" | "closed";

type Props = {
  status: Status;
  onClick?: () => void;
  sizePx?: number; // tamaño visible del canvas (px)
  resolution?: number; // N por lado (N*N puntos)
  radius?: number; // radio base de la esfera
  pointSize?: number; // tamaño base de las partículas
};

export function HoloHalo({
  status,
  onClick,
  sizePx = 420,
  resolution = 180,
  radius = 1.2,
  pointSize = 1.8,
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

/* ============================================================================
 * Núcleo energético procedural: partículas vivas + latido + halo holográfico
 * ============================================================================
 */
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
    const vert = /* glsl */ `
      precision highp float;
      varying float vSpark;
      varying vec3  vCol;

      uniform float uTime;
      uniform float uState;
      uniform float uRadius;
      uniform float uPointSize;

      // HSV -> RGB para gradiente holográfico
      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      void main(){
        float u = uv.x, v = uv.y;
        float th = 6.2831853 * u;       // theta
        float ph = acos(2.0*v - 1.0);   // phi
        vec3 n = vec3(
          sin(ph)*cos(th),
          cos(ph),
          sin(ph)*sin(th)
        );

        // Latido central
        float beat = 0.5 + 0.5 * sin(uTime * mix(0.8, 1.6, uState * 0.5));
        float r = uRadius * (0.9 + 0.08 * beat);

        // Orbitas suaves con variación per-punto
        float noise = sin(dot(n.xy, vec2(12.9898,78.233)) * 43758.5453);
        float twist = 0.15 * sin(uTime * 0.5 + noise * 6.28);
        vec3 p = n * r;
        p.xz *= mat2(cos(twist), -sin(twist), sin(twist), cos(twist));

        // Pose general: ligera rotación global
        float t = uTime * 0.22;
        mat2 R = mat2(cos(t), -sin(t), sin(t), cos(t));
        p.xz = R * p.xz;

        // Salida clip space
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        // Colores holográficos dinámicos
        float hue = fract(0.55 + 0.25 * sin(uTime*0.6) + n.y*0.25);
        vec3 cold = hsv2rgb(vec3(hue, 0.95, 1.0));
        vec3 hot  = vec3(0.0, 0.95, 1.0);
        vCol = mix(cold, hot, smoothstep(1.0, 2.0, uState));

        // Brillo “chispa” → zonas con mayor velocidad aparente
        vSpark = smoothstep(0.85, 1.0, beat);

        // Tamaño por perspectiva
        float factor = mix(0.85, 1.4, smoothstep(1.0, 2.0, uState));
        float boost  = mix(1.0, 1.5, vSpark);
        gl_PointSize = uPointSize * factor * boost * (300.0 / -mv.z);
      }
    `;

    const frag = /* glsl */ `
      precision highp float;
      varying float vSpark;
      varying vec3  vCol;

      void main(){
        vec2 q = gl_PointCoord*2.0 - 1.0;
        float d = dot(q,q);
        if (d > 1.0) discard;

        float ring = smoothstep(0.95, 0.0, d);
        vec3 col = vCol * (0.55 + 0.45*ring);
        col += vSpark * 0.5; // chispa sutil

        float alpha = (1.0 - d) * (0.65 + 0.35*vSpark);
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

  // animación: sincroniza estado con shader
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
