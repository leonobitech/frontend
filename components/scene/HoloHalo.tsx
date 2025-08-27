"use client";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type Props = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** Tamaño del contenedor (px) — usa Tailwind arbitrary sin bg */
  sizePx?: number; // default 420
  /** Resolución NxN de partículas (puntos = N*N) */
  resolution?: number; // default 256 (≈65k)
  /** Radio visual de la esfera */
  radius?: number; // default 1.2
  /** Velocidad de la simulación (modulada por status) */
  speed?: number; // default 1.0
  /** Tamaño base del punto */
  pointSize?: number; // default 1.6
};

export function HoloHalo({
  status,
  onClick,
  className = "",
  sizePx = 420,
  resolution = 256,
  radius = 1.2,
  speed = 1.0,
  pointSize = 1.6,
}: Props) {
  return (
    <div
      className={[
        "relative rounded-2xl", // 🔹 sin bg, canvas es transparente
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
        <SceneCore
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

/* ===================================================================================
 * Núcleo: Simulación GPU (ping-pong FBO) + render de puntos
 * =================================================================================== */
function SceneCore({
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
  const alive = useAlive();
  useSceneCleanup();
  const { gl } = useThree();
  const meshRef = useRef<THREE.Points>(null!);

  // ---------- Helpers FBO ----------
  const size = resolution;
  const texOpts = useMemo(() => {
    const fmt = THREE.RGBAFormat;
    const type = gl.capabilities.isWebGL2
      ? THREE.FloatType
      : (THREE.HalfFloatType as unknown as THREE.TextureDataType); // fallback
    return { fmt, type };
  }, [gl]);

  // Textura inicial de posiciones (en esfera)
  const initialPositions = useMemo(() => {
    const data = new Float32Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      // punto aleatorio en esfera
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.0 * Math.cbrt(Math.random()); // más densidad hacia el centro
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      data[i * 4 + 0] = x * radius;
      data[i * 4 + 1] = y * radius;
      data[i * 4 + 2] = z * radius;
      data[i * 4 + 3] = 1.0; // w (no usado)
    }
    const tex = new THREE.DataTexture(
      data,
      size,
      size,
      texOpts.fmt,
      texOpts.type
    );
    tex.needsUpdate = true;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = tex.minFilter = THREE.NearestFilter;
    return tex;
  }, [size, radius, texOpts]);

  // RenderTargets ping-pong (A<->B)
  const { rtA, rtB, simScene, simCam, simMat } = useMemo(() => {
    const mkRT = () =>
      new THREE.WebGLRenderTarget(size, size, {
        depthBuffer: false,
        stencilBuffer: false,
        magFilter: THREE.NearestFilter,
        minFilter: THREE.NearestFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
        type: texOpts.type,
        format: texOpts.fmt,
      });

    const rtA = mkRT();
    const rtB = mkRT();

    // escena ortográfica para simulation pass (quad full-screen)
    const simScene = new THREE.Scene();
    const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geom = new THREE.PlaneGeometry(2, 2);

    const simMat = new THREE.ShaderMaterial({
      uniforms: {
        uPositions: { value: initialPositions },
        uTime: { value: 0 },
        uDelta: { value: 0 },
        uStatus: { value: 1 }, // 0,1,2
        uRadius: { value: radius },
        uSpeed: { value: speed },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      // Sim fragment: actualiza posiciones con ruido/curl-like sencillo
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;

        uniform sampler2D uPositions; // RGBA -> xyzw
        uniform float uTime;
        uniform float uDelta;
        uniform float uStatus;  // 0=closed,1=connecting,2=open
        uniform float uRadius;
        uniform float uSpeed;

        // value noise
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);
          float a=hash(i), b=hash(i+vec2(1.,0.));
          float c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
          vec2 u=f*f*(3.-2.*f);
          return mix(a,b,u.x)+ (c-a)*u.y*(1.-u.x)+ (d-b)*u.x*u.y;
        }

        // campo direccional pseudo-curl
        vec3 field(vec3 p, float t){
          float n1 = noise(p.xy*1.2 + t*0.25);
          float n2 = noise(p.yz*1.3 - t*0.21);
          float n3 = noise(p.xz*1.1 + t*0.19);
          vec3 dir = normalize(vec3(n1-0.5, n2-0.5, n3-0.5) + 1e-4);
          return dir;
        }

        void main(){
          vec4 pos = texture2D(uPositions, vUv); // xyz
          vec3 p = pos.xyz;

          // fuerza según estado
          float k = mix(0.25, 1.0, uStatus*0.5); // closed<connecting<open

          // “latido” radial
          float beat = 0.5 + 0.5 * sin(uTime * mix(0.8, 1.6, uStatus*0.5));
          vec3 center = normalize(p) * uRadius * (0.92 + 0.06*beat);

          // advección en el campo + atracción leve al centro latiente
          vec3 v = field(p*0.8, uTime) * (uSpeed * k * 0.6);
          vec3 towards = (center - p) * 0.12 * k;
          p += (v + towards) * clamp(uDelta, 0.0, 0.033);

          // limite suave (mantener la nube dentro de la esfera)
          float r = length(p);
          if (r > uRadius){
            p = normalize(p) * uRadius * 0.98;
          }

          gl_FragColor = vec4(p, 1.0);
        }
      `,
    });

    const quad = new THREE.Mesh(geom, simMat);
    simScene.add(quad);

    // precargar A con las posiciones iniciales
    return { rtA, rtB, simScene, simCam, simMat };
  }, [size, texOpts, initialPositions, radius, speed]);

  // Geometría de puntos: NxN puntos con atributo uv para samplear la textura
  const renderGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const count = size * size;
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    let i = 0,
      j = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        positions[i++] = 0;
        positions[i++] = 0;
        positions[i++] = 0; // se ajusta en VS
        uvs[j++] = (x + 0.5) / size;
        uvs[j++] = (y + 0.5) / size;
      }
    }
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return geom;
  }, [size]);

  // Material de render (lee la textura de posiciones)
  const renderMat = useMemo(() => {
    const vert = /* glsl */ `
      precision highp float;
      attribute vec2 uv;
      varying float vDepth;
      varying float vAlpha;
      varying vec3 vCol;

      uniform sampler2D uPositions;
      uniform float uTime;
      uniform float uState;
      uniform float uPointSize;

      // hsv util
      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      void main(){
        vec3 pos = texture2D(uPositions, uv).xyz;

        // le damos una pose “orbital” suave
        float t = uTime * 0.25;
        mat2 R = mat2(cos(t), -sin(t), sin(t), cos(t));
        vec3 p = pos;
        p.xz = R * p.xz;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        // tamaño y alpha por perspectiva y estado
        float base = uPointSize;
        float factor = mix(0.8, 1.4, smoothstep(1.0, 2.0, uState));
        gl_PointSize = base * factor * (300.0 / -mv.z);

        vDepth = normalize(p).z;
        float pulse = 0.6 + 0.4 * (0.5 + 0.5*sin(uTime * mix(0.8, 1.6, uState*0.5)));
        vAlpha = clamp(0.6 * pulse, 0.0, 1.0);

        float hue = fract(0.55 + 0.25*sin(uTime*0.6) + vDepth*0.25);
        vec3 cold = hsv2rgb(vec3(hue, 0.95, 1.0));
        vec3 hot  = vec3(0.0, 0.95, 1.0);
        vCol = mix(cold, hot, smoothstep(1.0, 2.0, uState));
      }
    `;

    const frag = /* glsl */ `
      precision highp float;
      varying float vDepth;
      varying float vAlpha;
      varying vec3 vCol;

      void main(){
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float d = dot(uv, uv);
        if (d > 1.0) discard;

        float ring = smoothstep(0.9, 0.0, d);
        vec3 col = vCol * (0.55 + 0.45 * ring);
        gl_FragColor = vec4(col, (1.0 - d) * vAlpha);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: {
        uPositions: { value: initialPositions }, // se actualiza cada frame con rt.colorTexture
        uTime: { value: 0 },
        uState: { value: 1 },
        uPointSize: { value: pointSize },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [initialPositions, pointSize]);

  // Sim loop + render loop
  const ping = useRef<THREE.WebGLRenderTarget>(rtA);
  const pong = useRef<THREE.WebGLRenderTarget>(rtB);
  const last = useRef<number>(0);

  useFrame(({ clock }) => {
    if (!alive.current) return;

    const t = clock.getElapsedTime();
    const dt = Math.min(0.033, t - (last.current || t));
    last.current = t;

    // SIM: uPositions = ping, dibuja en pong
    simMat.uniforms.uPositions.value = ping.current.texture;
    simMat.uniforms.uTime.value = t;
    simMat.uniforms.uDelta.value = dt;
    simMat.uniforms.uStatus.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;

    gl.setRenderTarget(pong.current);
    gl.render(simScene, simCam);
    gl.setRenderTarget(null);

    // RENDER: usar textura actualizada
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uPositions.value = pong.current.texture;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;

    // swap
    const tmp = ping.current;
    ping.current = pong.current;
    pong.current = tmp;
  });

  return (
    <points
      ref={meshRef}
      geometry={renderGeom}
      material={renderMat}
      onClick={useCallback(() => onClick?.(), [onClick])}
    />
  );
}
