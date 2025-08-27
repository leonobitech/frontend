"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export type Status = "open" | "connecting" | "closed";

type Props = {
  status: Status;
  onClick?: () => void;
  sizePx?: number;
  count?: number; // cantidad total de partículas
  radius?: number; // radio medio
  pointSize?: number; // tamaño visual del punto
};

export function HoloHalo({
  status,
  onClick,
  sizePx = 420,
  count = 2500, // menos puntos = más “aire”
  radius = 1.25,
  pointSize = 1.4,
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
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <ParticleNebula
          status={status}
          onClick={onClick}
          count={count}
          radius={radius}
          pointSize={pointSize}
        />
      </Canvas>
    </div>
  );
}

/* ============================================================================
 * Núcleo: nube esférica dispersa, partículas translúcidas y holográficas
 * ============================================================================
 */
function ParticleNebula({
  status,
  onClick,
  count,
  radius,
  pointSize,
}: {
  status: Status;
  onClick?: () => void;
  count: number;
  radius: number;
  pointSize: number;
}) {
  const ptsRef = useRef<THREE.Points>(null!);

  // Generamos posiciones 3D aleatorias uniformes en esfera
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Dirección aleatoria
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.6 + Math.random() * 0.4); // grosor real de la nube
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions.set([x, y, z], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count, radius]);

  const mat = useMemo(() => {
    const vert = /* glsl */ `
      precision highp float;
      varying vec3 vPos;
      void main() {
        vPos = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = ${pointSize.toFixed(1)} * (300.0 / -mv.z);
      }
    `;

    const frag = /* glsl */ `
      precision highp float;
      varying vec3 vPos;

      // helper para gradiente holográfico animado
      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      uniform float uTime;
      uniform float uState;

      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float d = dot(uv, uv);
        if (d > 1.0) discard;

        // gradiente dinámico holográfico
        float hue = fract(0.55 + 0.3 * sin(uTime*0.5 + vPos.y * 2.0));
        vec3 col = hsv2rgb(vec3(hue, 0.9, 1.0));

        // modula intensidad por estado
        float intensity = mix(0.25, 1.0, smoothstep(0.0, 2.0, uState));

        // borde suave de cada partícula
        float alpha = (1.0 - d) * intensity * 0.85;

        gl_FragColor = vec4(col, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 1 },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [pointSize]);

  // animación: sincroniza estado y tiempo
  useFrame(({ clock }) => {
    if (!ptsRef.current) return;
    const t = clock.getElapsedTime();
    const m = ptsRef.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = t;
    m.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;

    // rotación global para “vida”
    ptsRef.current.rotation.y = t * 0.12;
    ptsRef.current.rotation.x = Math.sin(t * 0.07) * 0.1;
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
