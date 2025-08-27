"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";

export type Status = "open" | "connecting" | "closed";

type Props = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** Imagen base (png/jpg con alpha o fondo blanco/negro). */
  imageSrc: string;

  /** Tamaño visual del canvas */
  sizePx?: number; // default 420
  /** Densidad: N por lado (N*N puntos) */
  resolution?: number; // default 200
  /** Radio de la esfera al morfear */
  radius?: number; // default 1.2
  /** Tamaño base del punto */
  pointSize?: number; // default 1.7
  /** 0..1: cuánto “tira” la imagen vs la esfera (además del status) */
  imageStrength?: number; // default 1.0
  /** Umbral de luminancia/alpha para descartar píxeles (0..1) */
  threshold?: number; // default 0.1
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
  imageStrength = 1.0,
  threshold = 0.1,
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
        <ParticlesFromImage
          status={status}
          onClick={onClick}
          imageSrc={imageSrc}
          resolution={resolution}
          radius={radius}
          pointSize={pointSize}
          imageStrength={imageStrength}
          threshold={threshold}
        />
      </Canvas>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ParticlesFromImage({
  status,
  onClick,
  imageSrc,
  resolution,
  radius,
  pointSize,
  imageStrength,
  threshold,
}: {
  status: Status;
  onClick?: () => void;
  imageSrc: string;
  resolution: number;
  radius: number;
  pointSize: number;
  imageStrength: number;
  threshold: number;
}) {
  const texture = useLoader(THREE.TextureLoader, imageSrc);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

  const ptsRef = useRef<THREE.Points>(null!);
  const N = resolution;

  // Grid N*N con UVs (0..1)
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
      // uv viene inyectado por Three
      varying vec2 vUv;
      varying vec3 vCol;

      uniform sampler2D uTex;
      uniform vec2  uTexSize;   // ratio de la imagen
      uniform float uTime;
      uniform float uState;     // 0/1/2
      uniform float uRadius;
      uniform float uPointSize;
      uniform float uImgStr;    // 0..1
      uniform float uThresh;    // 0..1

      // util: hsv
      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      // conv UV -> pos en plano centrado manteniendo aspecto
      vec3 imagePlane(vec2 uv){
        // mantener proporción de la textura dentro de [-1,1]
        float ar = uTexSize.x / max(uTexSize.y, 1.0); // ancho / alto
        vec2 p = (uv * 2.0 - 1.0);
        p.x *= ar;               // ancho según aspect ratio
        p *= 0.9;                // margen
        return vec3(p, 0.0);
      }

      // esfera paramétrica desde uv
      vec3 spherePos(vec2 uv){
        float th = 6.2831853 * uv.x;        // theta
        float ph = acos(2.0*uv.y - 1.0);    // phi
        vec3 n = vec3(sin(ph)*cos(th), cos(ph), sin(ph)*sin(th));
        return n * uRadius;
      }

      void main(){
        vUv = uv;

        // muestreo de la imagen
        vec4 texel = texture2D(uTex, uv);
        float lum = dot(texel.rgb, vec3(0.299,0.587,0.114));
        float alpha = max(texel.a, lum); // si no hay alpha, usa luminancia

        // factor de morfeo imagen<->esfera (status + parámetro)
        float s = uImgStr * (0.35 + 0.65 * smoothstep(0.0, 2.0, uState));
        // latido modula levemente el morph
        float beat = 0.5 + 0.5 * sin(uTime * mix(0.8, 1.6, uState*0.5));
        s = clamp(s * (0.9 + 0.1*beat), 0.0, 1.0);

        vec3 pImg = imagePlane(uv);
        vec3 pSph = spherePos(uv);

        // mezcla posiciones
        vec3 pos = mix(pSph, pImg, s);

        // rotación suave para dar vida
        float t = uTime * 0.25;
        mat2 R = mat2(cos(t), -sin(t), sin(t), cos(t));
        pos.xz = R * pos.xz;

        // descartar “virtualmente” puntos por debajo del umbral empujándolos fuera
        // (no podemos descartar vértices aquí; se hará en el fragment)
        // solo ajustamos el tamaño luego; pasamos color para FS
        vCol = mix(texel.rgb, hsv2rgb(vec3(0.55 + 0.25*sin(uTime*0.4), 0.9, 1.0)),
                   1.0 - s); // más cian holográfico cuando domina la esfera

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;

        // tamaño con perspectiva
        float base = uPointSize * (0.9 + 0.1*beat);
        gl_PointSize = base * (300.0 / -mv.z);
      }
    `;

    const frag = /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      varying vec3 vCol;

      uniform sampler2D uTex;
      uniform float uState;
      uniform float uThresh;

      void main(){
        // máscara circular del punto
        vec2 q = gl_PointCoord*2.0 - 1.0;
        float d = dot(q,q);
        if (d > 1.0) discard;

        // umbral de visibilidad según la imagen (alpha o luminancia)
        vec4 texel = texture2D(uTex, vUv);
        float lum = dot(texel.rgb, vec3(0.299,0.587,0.114));
        float visibility = max(texel.a, lum);

        if (visibility < uThresh && uState < 1.0) {
          // en estados bajos respetamos más el umbral (imagen más recortada)
          discard;
        }

        // brillo “eléctrico” leve en borde del punto
        float ring = smoothstep(0.95, 0.0, d);
        vec3 col = vCol * (0.55 + 0.45*ring);

        float alpha = (1.0 - d) * (0.6 + 0.4 * smoothstep(1.0, 2.0, uState));
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
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [texture, radius, pointSize, imageStrength, threshold]);

  useFrame(({ clock }) => {
    if (!ptsRef.current) return;
    const t = clock.getElapsedTime();
    const m = ptsRef.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = t;
    m.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;
    // refrescar tamaño de imagen por si tarda en cargar
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
