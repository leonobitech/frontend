"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type HoloHaloProps = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** tamaño del canvas (px aprox) */
  sizePx?: number; // default 420
  /** resolución de puntos (más = más denso) */
  rings?: number; // default 140 (meridianos)
  segments?: number; // default 180 (paralelos)
};

export function HoloHalo({
  status,
  className,
  onClick,
  rings = 140,
  segments = 180,
}: HoloHaloProps) {
  return (
    <div className={className}>
      <div
        className={`
      cursor-pointer 
    rounded-2xl 
    bg-black
    w-[320px] h-[320px] 
    sm:w-[420px] sm:h-[420px] 
    md:w-[500px] md:h-[500px]
    `}
        onClick={onClick}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 3.8], fov: 32 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
          }}
        >
          <color attach="background" args={["#000000"]} />
          <FacePoints status={status} rings={rings} segments={segments} />
        </Canvas>
      </div>
    </div>
  );
}

/* --------------------------- interno --------------------------- */

function FacePoints({
  status,
  rings,
  segments,
}: {
  status: Status;
  rings: number;
  segments: number;
}) {
  const pointsRef = useRef<THREE.Points>(null!);
  const alive = useAlive();
  useSceneCleanup();

  // Geometría: muestreamos una “esfera” en coordenadas esféricas (u,v)
  // y dejamos que el shader deforme para parecer una cabeza.
  const geometry = useMemo(() => {
    const count = rings * segments;
    const positions = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);

    let i = 0;
    let j = 0;
    for (let r = 0; r < rings; r++) {
      const v = r / (rings - 1); // 0..1
      // limitamos a hemisferio + un poco más
      const phi = v * Math.PI * 0.9; // 0..~162°
      for (let s = 0; s < segments; s++) {
        const u = s / segments; // 0..1
        const theta = u * Math.PI * 2; // 0..2π

        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.cos(phi);
        const z = Math.sin(phi) * Math.sin(theta);

        positions[i + 0] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;
        i += 3;

        uv[j + 0] = u;
        uv[j + 1] = v;
        j += 2;
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return g;
  }, [rings, segments]);

  const material = useMemo(() => {
    const vert = /* glsl */ `
      precision highp float;

      attribute vec2 uv;

      uniform float uTime;
      uniform float uState; // 0=closed,1=connecting,2=open

      // convierte de esféricas “base” (posición de atributo) a “cabeza”
      vec3 headDeform(vec3 p) {
        // estiramos en Y (cráneo) y sutilmente comprimimos X en mandíbula
        float y = p.y;
        float squashJaw = smoothstep(-0.6, -0.1, y); // 0 en cráneo, 1 en mandíbula
        vec3 q = p;
        q.y *= 1.25 + 0.1 * smoothstep(-0.2, 0.8, y); // coronilla más alta
        q.x *= mix(1.0, 0.78, squashJaw);
        q.z *= mix(1.0, 0.9, squashJaw);

        // nariz (gauss cerca del eje Z+ y parte media Y)
        float nose = exp(-pow(q.x*3.2,2.0) - pow((q.y-0.05)*3.0,2.0)) * 0.16;
        q.z += nose;

        // pómulos
        float cheekL = exp(-pow((q.x+0.42)*2.3,2.0) - pow((q.y+0.05)*2.2,2.0)) * 0.08;
        float cheekR = exp(-pow((q.x-0.42)*2.3,2.0) - pow((q.y+0.05)*2.2,2.0)) * 0.08;
        q.z += cheekL + cheekR;

        // mentón
        float chin = exp(-pow(q.x*2.0,2.0) - pow((q.y+0.55)*3.0,2.0)) * 0.14;
        q.z -= chin;

        // onda interna animada (ripple) que “escucha”
        float r = length(q.xz);
        float centerY = 0.15 * sin(uTime * (0.6 + 0.5*uState)); // centro móvil
        float phase = r*7.0 - (uTime * (0.8 + 0.6*uState)) - (q.y - centerY)*4.0;
        float wave = 0.06 * sin(phase) * smoothstep(0.0, 0.9, 1.0-abs(q.y));
        q += normalize(q+0.0001) * wave;

        return q;
      }

      void main() {
        vec3 p = position;
        vec3 h = headDeform(p);

        // levitación sutil
        float bob = 0.06 * sin(uTime * 0.9);
        h.y += bob;

        // tamaño de punto según “exposición” (más adelante = más grande)
        float pointSize = 2.0 + 2.0 * smoothstep(-0.2, 0.6, h.z);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(h, 1.0);
        // corregimos por DPI
        gl_PointSize = pointSize * (300.0 / - (modelViewMatrix * vec4(h,1.0)).z);
      }
    `;

    const frag = /* glsl */ `
      precision highp float;

      uniform float uTime;
      uniform float uState; // 0=closed,1=connecting,2=open

      // gradiente arcoíris
      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0., 2./3., 1./3.)) * 6. - 3.);
        return c.z * mix(vec3(1.), clamp(p - 1., 0., 1.), c.y);
      }

      void main() {
        // suavizamos el punto en círculo
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float d = dot(uv, uv);
        if (d > 1.0) discard;

        float t = uTime;

        // base: cian/azul
        vec3 base = vec3(0.0, 0.92, 1.0);

        // scan radial en el sprite del punto
        float ring = smoothstep(0.0, 0.8, 1.0 - d);
        float glow = pow(1.0 - d, 2.0);

        // modo por estado
        vec3 col;
        if (uState < 0.5) {
          // closed → gris azulado tenue
          col = mix(vec3(0.55), base*0.65, 0.35) * (0.4 + 0.6*ring);
        } else if (uState < 1.5) {
          // connecting → arcoíris animado
          float hue = fract(0.55 + 0.25*sin(t*0.6) + glow*0.2);
          col = hsv2rgb(vec3(hue, 0.9, 1.0)) * (0.6 + 0.4*ring);
        } else {
          // open → cian brillante con highlight magenta
          vec3 hi = hsv2rgb(vec3(0.84, 0.7, 1.0));
          col = mix(base, hi, 0.25 + 0.25*sin(t*0.7)) * (0.65 + 0.35*ring);
        }

        // borde suave del punto
        float alpha = smoothstep(1.0, 0.0, d);
        gl_FragColor = vec4(col, alpha);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 2 }, // open por defecto
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
    });
    return mat;
  }, []);

  useFrame(({ clock }) => {
    if (!alive.current || !pointsRef.current) return;
    const t = clock.getElapsedTime();
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = t;
    // mapear status → uState
    mat.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;

    // giro holográfico suave
    pointsRef.current.rotation.y = Math.sin(t * 0.25) * 0.15;
    pointsRef.current.rotation.x = THREE.MathUtils.degToRad(8);
  });

  // material para puntos (shader) + tamaño base
  const pointsMaterial = useMemo(() => material, [material]);

  return (
    <points ref={pointsRef} geometry={geometry} material={pointsMaterial} />
  );
}
