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

  /** Tamaño del contenedor (px) — Tailwind arbitrary values */
  sizePx?: number; // default 420
  /** Resolución NxN de la simulación (puntos = N*N) */
  resolution?: number; // default 256 (≈65k)
  /** Radio visual */
  radius?: number; // default 1.25
  /** Velocidad base de la simulación */
  speed?: number; // default 1.0
  /** Tamaño base del punto */
  pointSize?: number; // default 1.7
};

export function HoloHalo({
  status,
  onClick,
  className = "",
  sizePx = 420,
  resolution = 256,
  radius = 1.25,
  speed = 1.0,
  pointSize = 1.7,
}: Props) {
  return (
    <div
      className={[
        "relative rounded-full overflow-hidden", // máscara circular y sin fondo
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
 * Núcleo: Simulación GPU (ping-pong FBO) + render de puntos con “chispa”
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
  const pointsRef = useRef<THREE.Points>(null!);

  const N = resolution;

  // ---- opciones de textura (WebGL2 -> Float; fallback HalfFloat) -------------------
  const texOpts = useMemo(() => {
    const fmt = THREE.RGBAFormat;
    const type = (
      gl.capabilities.isWebGL2 ? THREE.FloatType : THREE.HalfFloatType
    ) as THREE.TextureDataType;
    return { fmt, type };
  }, [gl]);

  // ---- posiciones iniciales (DataTexture) -----------------------------------------
  const initialPositions = useMemo(() => {
    const data = new Float32Array(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = Math.cbrt(Math.random()); // densidad hacia centro
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      data[i * 4 + 0] = x * radius;
      data[i * 4 + 1] = y * radius;
      data[i * 4 + 2] = z * radius;
      data[i * 4 + 3] = 1.0;
    }
    const tex = new THREE.DataTexture(data, N, N, texOpts.fmt, texOpts.type);
    tex.needsUpdate = true;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = tex.minFilter = THREE.NearestFilter;
    return tex;
  }, [N, radius, texOpts]);

  // ---- render targets ping-pong + escena de simulación -----------------------------
  const { rtA, rtB, simScene, simCam, simMat } = useMemo(() => {
    const mkRT = () =>
      new THREE.WebGLRenderTarget(N, N, {
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

    const simScene = new THREE.Scene();
    const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeom = new THREE.PlaneGeometry(2, 2);

    const simMat = new THREE.ShaderMaterial({
      uniforms: {
        uPositions: { value: initialPositions }, // textura de entrada
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
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;

        uniform sampler2D uPositions;
        uniform float uTime, uDelta, uStatus, uRadius, uSpeed;

        // --- noise util (value noise 3D) ---
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float n3(vec3 p){
          vec3 i=floor(p), f=fract(p);
          float n=dot(i, vec3(1.0,57.0,113.0));
          vec3 u=f*f*(3.0-2.0*f);
          float a=h(vec2(n+0.0,n+0.0));
          float b=h(vec2(n+1.0,n+0.0));
          float c=h(vec2(n+57.0,n+0.0));
          float d=h(vec2(n+58.0,n+0.0));
          float e=h(vec2(n+113.0,n+0.0));
          float f2=h(vec2(n+114.0,n+0.0));
          float g=h(vec2(n+170.0,n+0.0));
          float k=h(vec2(n+171.0,n+0.0));
          float x=mix(a,b,u.x), y=mix(c,d,u.x), z=mix(e,f2,u.x), w=mix(g,k,u.x);
          return mix(mix(x,y,u.y), mix(z,w,u.y), u.z);
        }
        // curl aproximado
        vec3 curl(vec3 p){
          float e=0.1;
          float n1=n3(p+vec3( e,0,0)), n2=n3(p+vec3(-e,0,0));
          float n3a=n3(p+vec3(0, e,0)), n4=n3(p+vec3(0,-e,0));
          float n5=n3(p+vec3(0,0, e)), n6=n3(p+vec3(0,0,-e));
          vec3 c=vec3(n4-n3a, n1-n2, n6-n5)/(2.0*e);
          return normalize(c+1e-5);
        }
        // SDF
        float sdSphere(vec3 p, float r){ return length(p)-r; }
        float sdTorus(vec3 p, vec2 t){ vec2 q=vec2(length(p.xz)-t.x, p.y); return length(q)-t.y; }
        float sdBlob(vec3 p){
          float s=0.0; vec3 q=p*1.2; float a=1.0;
          for(int i=0;i<4;i++){ s += n3(q)*a; q*=1.8; a*=0.5; }
          return length(p)-(0.9+0.15*s);
        }

        void main(){
          vec3 p = texture2D(uPositions, vUv).xyz;

          // Intensidades por estado
          float k = mix(0.25, 1.0, uStatus*0.5); // fuerza general
          float spin = mix(0.2, 0.7, uStatus*0.5);
          float cAmp = mix(0.6, 1.2, uStatus*0.5);

          // Latido
          float beat = 0.5 + 0.5*sin(uTime * mix(0.8, 1.6, uStatus*0.5));

          // Morph objetivo (mezcla esfera/torus/blob)
          float m = 0.5 + 0.5*sin(uTime*0.35);
          float dSphere = sdSphere(p, uRadius*(0.9+0.06*beat));
          float dTorus  = sdTorus(p, vec2(uRadius*0.75, uRadius*0.22));
          float dBlob   = sdBlob(p*0.8);
          float targetD = mix(mix(dSphere,dTorus,m), dBlob, 0.35+0.35*sin(uTime*0.21));

          // gradiente esfera (aprox) para atraer hacia forma
          float eps = 0.01*uRadius;
          vec3 grad = normalize(vec3(
            sdSphere(p+vec3(eps,0,0), uRadius) - sdSphere(p-vec3(eps,0,0), uRadius),
            sdSphere(p+vec3(0,eps,0), uRadius) - sdSphere(p-vec3(0,eps,0), uRadius),
            sdSphere(p+vec3(0,0,eps), uRadius) - sdSphere(p-vec3(0,0,eps), uRadius)
          ));

          // Campo: curl + vórtice + atracción SDF
          vec3 v = curl(p*0.8 + vec3(0,uTime*0.2,0)) * (uSpeed*cAmp*0.8);
          vec3 vortex = vec3(-p.z, 0.0, p.x) * (spin*0.15);
          vec3 toShape = -normalize(grad) * clamp(targetD, -0.2, 0.2) * (0.6+0.2*beat);

          p += (v + vortex + toShape) * clamp(uDelta, 0.0, 0.033);

          // límite suave
          float r = length(p);
          if (r > uRadius) p = normalize(p) * uRadius * 0.98;

          gl_FragColor = vec4(p, 1.0);
        }
      `,
    });

    simScene.add(new THREE.Mesh(quadGeom, simMat));
    return { rtA, rtB, simScene, simCam, simMat };
  }, [N, texOpts, initialPositions, radius, speed]);

  // ---- geometría de render (N*N puntos con UV) ------------------------------------
  const renderGeom = useMemo(() => {
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

  // ---- material de render (lee pos actual y previa para vel/chispa) ----------------
  const renderMat = useMemo(() => {
    const vert = /* glsl */ `
      precision highp float;
      attribute vec2 uv;
      varying float vVel;
      varying float vDepth;
      varying vec3 vCol;

      uniform sampler2D uPositions;     // pos actual (pong)
      uniform sampler2D uPrevPositions; // pos previa (ping)
      uniform float uTime, uState, uPointSize, uVelScale;

      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      void main(){
        vec3 pos  = texture2D(uPositions, uv).xyz;
        vec3 prev = texture2D(uPrevPositions, uv).xyz;
        vec3 vel = pos - prev;
        float speed = length(vel) * uVelScale; // 0..~

        // pose orbital muy suave
        float t = uTime * 0.25;
        mat2 R = mat2(cos(t), -sin(t), sin(t), cos(t));
        vec3 p = pos; p.xz = R * p.xz;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        float factor = mix(0.8, 1.5, smoothstep(1.0, 2.0, uState));
        float sizeBoost = mix(1.0, 1.8, clamp(speed, 0.0, 1.0));
        gl_PointSize = uPointSize * factor * sizeBoost * (300.0 / -mv.z);

        vDepth = normalize(p).z;
        float hue = fract(0.55 + 0.25*sin(uTime*0.6) + vDepth*0.25);
        vec3 cold = hsv2rgb(vec3(hue, 0.95, 1.0));
        vec3 hot  = vec3(0.0, 0.95, 1.0);
        vec3 base = mix(cold, hot, smoothstep(1.0, 2.0, uState));
        vCol = mix(base, vec3(1.0,0.9,0.7), smoothstep(0.6, 1.4, speed)); // chispa blanca
        vVel = speed;
      }
    `;
    const frag = /* glsl */ `
      precision highp float;
      varying float vVel;
      varying float vDepth;
      varying vec3 vCol;

      void main(){
        vec2 q = gl_PointCoord * 2.0 - 1.0;
        float d = dot(q,q);
        if (d > 1.0) discard;

        float core = smoothstep(0.35, 0.0, d);
        float ring = smoothstep(0.95, 0.0, d);

        float spark = smoothstep(0.6, 1.3, vVel); // chispa por velocidad

        vec3 col = vCol * (0.55 + 0.45*ring);
        col += spark * 0.6; // estallido blanco sutil

        float alpha = (1.0 - d) * (0.65 + 0.35*spark);
        gl_FragColor = vec4(col, alpha);
      }
    `;
    return new THREE.ShaderMaterial({
      uniforms: {
        uPositions: { value: initialPositions },
        uPrevPositions: { value: initialPositions },
        uTime: { value: 0 },
        uState: { value: 1 },
        uPointSize: { value: pointSize },
        uVelScale: { value: 8.0 },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [initialPositions, pointSize]);

  // ---- ping-pong & loop -------------------------------------------------------------
  const ping = useRef<THREE.WebGLRenderTarget>(rtA);
  const pong = useRef<THREE.WebGLRenderTarget>(rtB);
  const last = useRef<number>(0);

  useFrame(({ clock }) => {
    if (!alive.current) return;

    const t = clock.getElapsedTime();
    const dt = Math.min(0.033, t - (last.current || t));
    last.current = t;

    // SIM: input = ping, output = pong
    simMat.uniforms.uPositions.value = ping.current.texture;
    simMat.uniforms.uTime.value = t;
    simMat.uniforms.uDelta.value = dt;
    simMat.uniforms.uStatus.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;

    gl.setRenderTarget(pong.current);
    gl.render(simScene, simCam);
    gl.setRenderTarget(null);

    // RENDER: usar actual y previa (para velocidad)
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uPositions.value = pong.current.texture;
    mat.uniforms.uPrevPositions.value = ping.current.texture;
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
      ref={pointsRef}
      geometry={renderGeom}
      material={renderMat}
      onClick={useCallback(() => onClick?.(), [onClick])}
    />
  );
}
