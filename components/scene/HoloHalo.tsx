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
    <Canvas
      className="!bg-transparent"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 40 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearAlpha(0)}
    >
      <Scene status={status} onClick={onClick} />
    </Canvas>
  );
}

/** Escena: geometría de partículas + material GLSL3 con máscara circular por fragment */
function Scene({ status, onClick }: { status: Status; onClick?: () => void }) {
  const ptsRef = useRef<THREE.Points>(null!);

  // parámetros base (sin depender de Tailwind ni estilos)
  const COUNT = 3600;
  const RADIUS = 1.25;

  // posiciones 3D con espesor (nube real)
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = RADIUS * (0.65 + 0.35 * Math.random());
      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const material = useMemo(() => {
    const vert = /* glsl */ `#version 300 es
      precision highp float;
      in vec3 position;
      in float aSeed;

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float uTime;
      uniform float uState;
      uniform float uPointSize;

      out vec3 vPos;
      out float vSeed;

      void main() {
        vec3 p = position;
        // swirl + respiración ligera
        float t = uTime;
        float spin = t * (0.2 + 0.08*uState) + aSeed * 6.28318;
        mat2 R = mat2(cos(spin), -sin(spin), sin(spin), cos(spin));
        p.xz = R * p.xz;
        p *= (1.0 + 0.05 * sin(t * (0.9 + 0.5*uState) + aSeed * 6.28318));
        p += normalize(p) * (0.03 * sin(t*1.3 + aSeed*20.0));

        vPos = p;
        vSeed = aSeed;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPointSize * (300.0 / -mv.z);
      }
    `;

    const frag = /* glsl */ `#version 300 es
      precision highp float;
      out vec4 outColor;

      in vec3 vPos;
      in float vSeed;

      uniform float uTime;
      uniform float uState;

      // resolución del canvas (px)
      uniform vec2 uResolution;

      // --- Máscara circular en pantalla ---
      // descarta todo fuera de un círculo centrado en el canvas
      bool inCircle() {
        vec2 center = uResolution * 0.5;
        float radius = min(uResolution.x, uResolution.y) * 0.5;
        float distPx = distance(gl_FragCoord.xy, center);
        return distPx <= radius;
      }

      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      void main() {
        if (!inCircle()) discard;

        vec2 q = gl_PointCoord * 2.0 - 1.0;
        float d = dot(q, q);
        if (d > 1.0) discard;

        // color holográfico
        float hue = fract(0.55 + 0.25*sin(uTime*0.6) + normalize(vPos).y*0.25 + vSeed*0.2);
        vec3 col = hsv2rgb(vec3(hue, 0.95, 1.0));

        // borde suave + “aire”
        float core = smoothstep(0.85, 0.0, d);
        float rim  = smoothstep(0.98, 0.0, d);
        col *= (0.55 + 0.45 * rim);

        // descarte fijo ~30% para no tapizar (no parpadea)
        if (vSeed < 0.30) discard;

        float intensity = mix(0.35, 0.9, clamp(uState/2.0, 0.0, 1.0));
        float alpha = core * intensity;
        if (alpha < 0.02) discard;

        outColor = vec4(col, alpha);
      }
    `;

    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 1 },
        uPointSize: { value: 1.3 }, // ajusta si querés más/menos tamaño de punto
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    // Forzar GLSL3 (WebGL2)
    m.glslVersion = THREE.GLSL3;
    return m;
  }, []);

  // animación + actualizar resolución real del canvas
  useFrame(({ clock, size }) => {
    if (!ptsRef.current) return;
    const t = clock.getElapsedTime();
    const mat = ptsRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;
    mat.uniforms.uResolution.value.set(size.width, size.height);

    ptsRef.current.rotation.y = t * 0.12;
    ptsRef.current.rotation.x = Math.sin(t * 0.07) * 0.1;
  });

  return (
    <points
      ref={ptsRef}
      args={[geometry, material]}
      onClick={useCallback(() => onClick?.(), [onClick])}
    />
  );
}
