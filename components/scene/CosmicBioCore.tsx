// components/scene/CosmicBioCore.tsx
"use client";

import React, { useEffect, useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export type UIStatus = "open" | "connecting" | "closed";
type Props = { status: UIStatus; onClick?: () => void };

/* ------------------------ status driver: 0/1/2 ------------------------ */
function useStatusDriver(status: UIStatus) {
  const kRef = useRef(0);
  useEffect(() => {
    kRef.current = status === "closed" ? 0 : status === "connecting" ? 1 : 2;
  }, [status]);
  return kRef;
}

/* ----------------------------- GLSL chunks ---------------------------- */
const NOISE_GLSL = `
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-0.5;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  vec4 j=p-49.0*floor(p/49.0);
  vec4 x_=floor(j/7.0);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*0.142857142857; vec4 y=y_*0.142857142857;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 g0=vec3(a0.xy,h.x);
  vec3 g1=vec3(a1.xy,h.y);
  vec3 g2=vec3(a1.zw,h.z);
  vec3 g3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(g0,g0),dot(g1,g1),dot(g2,g2),dot(g3,g3)));
  g0*=norm.x; g1*=norm.y; g2*=norm.z; g3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m*=m;
  return 42.0*dot(m*m, vec4(dot(g0,x0),dot(g1,x1),dot(g2,x2),dot(g3,x3)));
}
float fbm(vec3 p){
  float v=0.0; float a=0.5; vec3 shift=vec3(100.0);
  for(int i=0;i<5;i++){ v+=a*snoise(p); p=p*2.0+shift; a*=0.5; }
  return v;
}
`;

const VERT_GLSL = `
uniform float uTime, uAmp, uFreq, uSpeed;
varying float vNoise;
void main(){
  vec3 pos = position;
  float n = fbm(pos * uFreq + vec3(uTime * uSpeed));
  vNoise = n;
  // desplaza a lo largo de la normal de la esfera
  pos += normalize(normal) * (uAmp * n);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  // tamaño de punto (solo afecta a Points)
  gl_PointSize = 1.8 * (300.0 / -mv.z);
}
`;

const FRAG_POINTS_GLSL = `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vNoise;
void main(){
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = dot(uv, uv);
  float alpha = smoothstep(1.0, 0.6, 1.0 - d);
  alpha *= uOpacity * (0.6 + 0.4 * clamp(vNoise*0.5+0.5, 0.0, 1.0));
  gl_FragColor = vec4(uColor, alpha);
}
`;

const FRAG_WIRE_GLSL = `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vNoise;
void main(){
  float a = uOpacity * (0.7 + 0.3 * clamp(vNoise*0.5+0.5, 0.0, 1.0));
  gl_FragColor = vec4(uColor, a);
}
`;

/* ----------------------------- Component ----------------------------- */
export function CosmicBioCore({ status, onClick }: Props) {
  return (
    <div className="relative w-96 h-96 bg-transparent">
      <Canvas
        className="absolute inset-0 !bg-transparent"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // transparente
          gl.setClearAlpha(0); // redundante pero seguro
          gl.domElement.style.backgroundColor = "transparent"; // 🔒
        }}
      >
        <ambientLight intensity={0.15} />
        <BlobScene status={status} onClick={onClick} />
      </Canvas>
    </div>
  );
}

/* ------------------------------- Scene ------------------------------- */
function BlobScene({
  status,
  onClick,
}: {
  status: UIStatus;
  onClick?: () => void;
}) {
  const group = useRef<THREE.Group | null>(null);
  const kRef = useStatusDriver(status);
  const handleClick = useCallback(() => onClick?.(), [onClick]);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const k = kRef.current;
    g.rotation.y = t * (0.12 + 0.08 * (k / 2));
    const s =
      1.0 +
      THREE.MathUtils.lerp(0.03, 0.11, k / 2) * Math.sin(t * (0.9 + 0.4 * k));
    g.scale.setScalar(s);
  });

  return (
    <group ref={group} onClick={handleClick}>
      <MorphBlob status={status} />
    </group>
  );
}

/* ------------------------------ MorphBlob ---------------------------- */
function MorphBlob({ status }: { status: UIStatus }) {
  const kRef = useStatusDriver(status);

  // Geometría base (densa para más detalle)
  const baseGeo = useMemo<THREE.IcosahedronGeometry>(
    () => new THREE.IcosahedronGeometry(1.2, 6),
    []
  );
  useEffect(() => () => baseGeo.dispose(), [baseGeo]);

  // Tipado de uniforms
  type Uniforms = {
    uTime: THREE.IUniform<number>;
    uAmp: THREE.IUniform<number>;
    uFreq: THREE.IUniform<number>;
    uSpeed: THREE.IUniform<number>;
    uColor: THREE.IUniform<THREE.Color>;
    uOpacity: THREE.IUniform<number>;
  };

  // Uniforms y materiales (puntos)
  const pointsUniforms = useMemo<Uniforms>(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.6 },
      uFreq: { value: 1.2 },
      uSpeed: { value: 0.6 },
      uColor: { value: new THREE.Color(0xbdd7ff) },
      uOpacity: { value: 0.95 },
    }),
    []
  );

  const pointsMat = useMemo<THREE.ShaderMaterial>(
    () =>
      new THREE.ShaderMaterial({
        uniforms: pointsUniforms as unknown as Record<string, THREE.IUniform>,
        vertexShader: `${NOISE_GLSL}\n${VERT_GLSL}`,
        fragmentShader: FRAG_POINTS_GLSL,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [pointsUniforms]
  );

  // Uniforms y material (wireframe)
  const wireUniforms = useMemo<Uniforms>(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.6 },
      uFreq: { value: 1.2 },
      uSpeed: { value: 0.6 },
      uColor: { value: new THREE.Color(0xdfeaff) },
      uOpacity: { value: 0.25 },
    }),
    []
  );

  const wireMat = useMemo<THREE.ShaderMaterial>(
    () =>
      new THREE.ShaderMaterial({
        uniforms: wireUniforms as unknown as Record<string, THREE.IUniform>,
        vertexShader: `${NOISE_GLSL}\n${VERT_GLSL}`,
        fragmentShader: FRAG_WIRE_GLSL,
        transparent: true,
        depthWrite: false,
        wireframe: true,
      }),
    [wireUniforms]
  );

  useEffect(() => {
    return () => {
      pointsMat.dispose();
      wireMat.dispose();
    };
  }, [pointsMat, wireMat]);

  // Animación de uniforms, modulada por status
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const k = kRef.current;

    const amp = THREE.MathUtils.lerp(0.25, 0.9, k / 2);
    const spd = THREE.MathUtils.lerp(0.35, 1.2, k / 2);
    const freq = THREE.MathUtils.lerp(0.9, 1.6, k / 2);

    pointsUniforms.uTime.value = t;
    pointsUniforms.uAmp.value = amp;
    pointsUniforms.uSpeed.value = spd;
    pointsUniforms.uFreq.value = freq;
    pointsUniforms.uOpacity.value = 0.8 + 0.2 * Math.sin(t * (1.7 + 0.3 * k));

    wireUniforms.uTime.value = t;
    wireUniforms.uAmp.value = amp;
    wireUniforms.uSpeed.value = spd;
    wireUniforms.uFreq.value = freq;
    wireUniforms.uOpacity.value = 0.18 + 0.08 * Math.sin(t * (1.3 + 0.4 * k));
  });

  return (
    <>
      <points geometry={baseGeo} material={pointsMat} />
      <mesh geometry={baseGeo} material={wireMat} />
    </>
  );
}
