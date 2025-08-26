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
  rings?: number;
  segments?: number;
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
        className="
          cursor-pointer rounded-2xl bg-black
          w-[360px] h-[360px]
          sm:w-[420px] sm:h-[420px]
          md:w-[480px] md:h-[480px]
        "
        onClick={onClick}
      >
        {/* 🔧 Canvas TRANSPARENTE (sin color de limpieza) */}
        <Canvas
          className="!bg-transparent block"
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 3.8], fov: 32 }}
          gl={{
            alpha: true, // <= importante
            antialias: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
          }}
        >
          {/* ❌ quita el <color attach="background" ... /> */}
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

  const geometry = useMemo(() => {
    const count = rings * segments;
    const positions = new Float32Array(count * 3);
    let i = 0;
    for (let r = 0; r < rings; r++) {
      const v = r / (rings - 1);
      const phi = v * Math.PI * 0.9;
      for (let s = 0; s < segments; s++) {
        const u = s / segments;
        const theta = u * Math.PI * 2.0;
        positions[i++] = Math.sin(phi) * Math.cos(theta);
        positions[i++] = Math.cos(phi);
        positions[i++] = Math.sin(phi) * Math.sin(theta);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [rings, segments]);

  const material = useMemo(() => {
    const vert = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform float uState;
      vec3 headDeform(vec3 p){
        float y = p.y;
        float squashJaw = smoothstep(-0.6,-0.1,y);
        vec3 q = p;
        q.y *= 1.25 + 0.1 * smoothstep(-0.2,0.8,y);
        q.x *= mix(1.0,0.78,squashJaw);
        q.z *= mix(1.0,0.90,squashJaw);
        float nose = exp(-pow(q.x*3.2,2.0) - pow((q.y-0.05)*3.0,2.0)) * 0.16;
        q.z += nose;
        float cheekL = exp(-pow((q.x+0.42)*2.3,2.0) - pow((q.y+0.05)*2.2,2.0))*0.08;
        float cheekR = exp(-pow((q.x-0.42)*2.3,2.0) - pow((q.y+0.05)*2.2,2.0))*0.08;
        q.z += cheekL + cheekR;
        float chin = exp(-pow(q.x*2.0,2.0) - pow((q.y+0.55)*3.0,2.0)) * 0.14;
        q.z -= chin;
        float r = length(q.xz);
        float centerY = 0.15 * sin(uTime*(0.6+0.5*uState));
        float phase = r*6.0 - (uTime*(0.8+0.6*uState)) - (q.y-centerY)*3.2;
        float wave = 0.05 * sin(phase) * smoothstep(0.0,0.9,1.0-abs(q.y));
        q += normalize(q+0.0001) * wave;
        return q;
      }
      void main(){
        vec3 h = headDeform(position);
        h.y += 0.05 * sin(uTime*0.9);
        vec4 mv = modelViewMatrix * vec4(h,1.0);
        gl_Position = projectionMatrix * mv;
        // puntos un poco más pequeños para evitar “mancha”
        float base = 1.6 + 1.6 * smoothstep(-0.2,0.6,h.z);
        gl_PointSize = base * (300.0 / -mv.z);
      }
    `;
    const frag = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform float uState;
      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }
      void main(){
        vec2 uv = gl_PointCoord*2.-1.;
        float d = dot(uv,uv);
        if(d>1.) discard;
        float t = uTime;
        vec3 base = vec3(0.0,0.92,1.0);
        float ring = smoothstep(0.0,0.8,1.0-d);
        vec3 col;
        if(uState<0.5){
          col = mix(vec3(0.55), base*0.65, 0.35) * (0.4+0.6*ring);
        } else if(uState<1.5){
          float hue = fract(0.55 + 0.25*sin(t*0.6) + (1.0-d)*0.2);
          col = hsv2rgb(vec3(hue,0.9,1.0)) * (0.6+0.4*ring);
        } else {
          vec3 hi = hsv2rgb(vec3(0.84,0.7,1.0));
          col = mix(base,hi,0.25+0.25*sin(t*0.7)) * (0.65+0.35*ring);
        }
        float alpha = smoothstep(1.0,0.0,d);
        gl_FragColor = vec4(col, alpha);
      }
    `;
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uState: { value: 2 } },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // 🔥 glow bonito sin bloquear el fondo
    });
    return m;
  }, []);

  useFrame(({ clock }) => {
    if (!alive.current || !pointsRef.current) return;
    const t = clock.getElapsedTime();
    const m = pointsRef.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = t;
    m.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;
    pointsRef.current.rotation.y = Math.sin(t * 0.25) * 0.15;
    pointsRef.current.rotation.x = THREE.MathUtils.degToRad(8);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
