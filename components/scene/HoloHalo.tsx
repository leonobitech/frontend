"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";

export type Status = "open" | "connecting" | "closed";

type Props = {
  status: Status;
  className?: string;
  onClick?: () => void;

  /** Imagen del logo (png/jpg). Si tiene alpha, mejor; si no, igual funciona. */
  imageSrc: string;

  /** Tamaño visual del canvas */
  sizePx?: number; // default 420
  /** Densidad: N por lado (N*N puntos) */
  resolution?: number; // default 200
  /** Radio de la esfera al morfear */
  radius?: number; // default 1.2
  /** Tamaño base del punto */
  pointSize?: number; // default 1.7
  /** 0..1 cuánto “tira” la imagen vs la esfera (además del status) */
  imageStrength?: number; // default 0.9
  /** Umbral 0..1 para ignorar fondo blanco/negro si no hay alpha */
  threshold?: number; // default 0.12
  /** Más jitter/vida en la silueta */
  jitter?: number; // default 0.015
};

export function HoloHalo({
  status,
  onClick,
  className = "",
  imageSrc,
  sizePx = 420,
  resolution = 200,
  radius = 1.2,
  pointSize = 1.7,
  imageStrength = 0.9,
  threshold = 0.12,
  jitter = 0.015,
}: Props) {
  return (
    <div
      className={[
        "relative rounded-full overflow-hidden",
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
        }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <LogoMorphParticles
          status={status}
          onClick={onClick}
          imageSrc={imageSrc}
          resolution={resolution}
          radius={radius}
          pointSize={pointSize}
          imageStrength={imageStrength}
          threshold={threshold}
          jitter={jitter}
        />
      </Canvas>
    </div>
  );
}

/* -------------------------- Núcleo: morph imagen ↔ esfera ------------------------- */

function LogoMorphParticles({
  status,
  onClick,
  imageSrc,
  resolution,
  radius,
  pointSize,
  imageStrength,
  threshold,
  jitter,
}: {
  status: Status;
  onClick?: () => void;
  imageSrc: string;
  resolution: number;
  radius: number;
  pointSize: number;
  imageStrength: number;
  threshold: number;
  jitter: number;
}) {
  const texture = useLoader(THREE.TextureLoader, imageSrc);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

  const ptsRef = useRef<THREE.Points>(null!);
  const N = resolution;

  // Grid N*N con uv (0..1)
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
      // 'uv' viene de la geometría (injection de Three)
      varying vec2 vUv;
      varying vec3 vCol;
      varying float vVis;

      uniform sampler2D uTex;
      uniform vec2  uTexSize;
      uniform float uTime;
      uniform float uState;     // 0 closed, 1 connecting, 2 open
      uniform float uRadius;
      uniform float uPointSize;
      uniform float uImgStr;    // 0..1
      uniform float uThresh;    // 0..1
      uniform float uJitter;    // 0..~

      // hash helpers (para jitter determinista por uv)
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      vec2  hash2(vec2 p){ return vec2(hash(p), hash(p+0.7)); }

      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      // mapea uv a plano imagen centrado con aspect ratio preservado en [-1,1]
      vec3 imagePlane(vec2 uv){
        float ar = uTexSize.x / max(uTexSize.y, 1.0);
        vec2 p = uv*2.0 - 1.0;
        p.x *= ar;
        p *= 0.9; // margen
        // jitter sutil para romper la grilla
        vec2 j = (hash2(uv) - 0.5) * uJitter * 2.0;
        p += j;
        return vec3(p, 0.0);
      }

      // esfera paramétrica desde uv
      vec3 spherePos(vec2 uv){
        float th = 6.2831853 * uv.x;     // theta
        float ph = acos(2.0*uv.y - 1.0); // phi
        vec3 n = vec3(sin(ph)*cos(th), cos(ph), sin(ph)*sin(th));
        // leve “respiración” segun estado
        float beat = 0.5 + 0.5 * sin(uTime * mix(0.8, 1.6, uState*0.5));
        float r = uRadius * (0.92 + 0.06*beat);
        return n * r;
      }

      void main(){
        vUv = uv;

        // muestreo
        vec4 texel = texture2D(uTex, uv);
        float lum = dot(texel.rgb, vec3(0.299,0.587,0.114));
        float a   = texel.a;

        // visibilidad: usa alpha si existe; si no, descarta fondos muy blancos/negros
        float visFromAlpha = a;
        float visFromLum   = (1.0 - smoothstep(1.0 - uThresh, 1.0, lum)) * smoothstep(uThresh, 1.0, lum);
        float visibility   = max(visFromAlpha, visFromLum); // 0..1
        vVis = visibility;

        // morph factor: esfera ↔ imagen
        float s = uImgStr * (0.35 + 0.65 * smoothstep(0.0, 2.0, uState));
        // en 'open' prioriza esfera; en 'connecting' imagen; en 'closed' imagen tenue
        s = mix(s, 0.0, step(1.5, uState));         // si open (uState≈2) → tira a esfera
        s = mix(s, s*0.8, step(0.5, uState));       // si connecting
        s = clamp(s, 0.0, 1.0);

        vec3 pImg = imagePlane(uv);
        vec3 pSph = spherePos(uv);
        vec3 pos  = mix(pSph, pImg, s);

        // rotación lenta para “vida”
        float t = uTime * 0.25;
        mat2 R = mat2(cos(t), -sin(t), sin(t), cos(t));
        pos.xz = R * pos.xz;

        // color: mezcla color imagen ↔ holográfico
        vec3 holo = hsv2rgb(vec3(0.55 + 0.25*sin(uTime*0.4), 0.9, 1.0));
        vCol = mix(holo, texel.rgb, s * visibility);

        // salida clip
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;

        // tamaño
        gl_PointSize = uPointSize * (300.0 / -mv.z);
      }
    `;

    const frag = /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      varying vec3 vCol;
      varying float vVis;

      uniform float uState;
      uniform float uThresh;

      void main(){
        vec2 q = gl_PointCoord*2.0 - 1.0;
        float d = dot(q,q);
        if (d > 1.0) discard;

        // si la visibilidad de la imagen es baja y aún no morfeamos a esfera, descartar
        if (vVis < uThresh && uState < 1.0) discard;

        // borde brillante
        float ring = smoothstep(0.95, 0.0, d);
        vec3 col = vCol * (0.55 + 0.45*ring);

        float alpha = (1.0 - d) * (0.58 + 0.42 * smoothstep(1.0, 2.0, uState));
        alpha *= max(vVis, 0.35); // nunca 0 total para que el morph no se corte feo
        if (alpha < 0.02) discard;

        gl_FragColor = vec4(col, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: texture },
        uTexSize: {
          value: new THREE.Vector2(
            texture.image?.width || 1,
            texture.image?.height || 1
          ),
        },
        uTime: { value: 0 },
        uState: { value: 1 },
        uRadius: { value: radius },
        uPointSize: { value: pointSize },
        uImgStr: { value: imageStrength },
        uThresh: { value: threshold },
        uJitter: { value: jitter },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [texture, radius, pointSize, imageStrength, threshold, jitter]);

  useFrame(({ clock }) => {
    if (!ptsRef.current) return;
    const t = clock.getElapsedTime();
    const m = ptsRef.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = t;
    m.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;

    // refresca tamaño de imagen cuando termine de cargar
    const tex = m.uniforms.uTex.value as THREE.Texture;
    if (tex?.image && m.uniforms.uTexSize.value.x === 1) {
      m.uniforms.uTexSize.value.set(tex.image.width, tex.image.height);
    }
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
