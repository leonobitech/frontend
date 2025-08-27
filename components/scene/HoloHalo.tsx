"use client";
import React, { useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";
export type HoloHaloMode = "wire" | "particles" | "glitch";

type HoloHaloProps = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** Modo visual (si no lo pasas, usa estado interno + panel) */
  mode?: HoloHaloMode;
  /** Mostrar panel de control integrado */
  showControls?: boolean;
};

/* ============================================================
 *  Componente principal
 * ============================================================ */
export function HoloHalo({
  status,
  className,
  onClick,
  mode,
  showControls = true,
}: HoloHaloProps) {
  // Estado interno si no viene `mode` como prop
  const [localMode, setLocalMode] = useState<HoloHaloMode>(mode ?? "particles");

  // Parámetros comunes y por modo (modificables por panel)
  const [wireParams, setWireParams] = useState({
    rings: 32,
    segments: 220,
    turnSpeed: 0.25,
  });
  const [particleParams, setParticleParams] = useState({
    rings: 120,
    segments: 180,
    size: 1.6, // base point size
    glow: true,
  });
  const [glitchParams, setGlitchParams] = useState({
    frequency: 6.0,
    scanlines: 0.6,
    glow: 0.85,
  });

  const activeMode = mode ?? localMode;

  return (
    <div className={className}>
      {/* Contenedor (negro, responsive) */}
      <div
        className="
          rounded-2xl bg-black
          w-[360px] h-[360px]
          sm:w-[420px] sm:h-[420px]
          md:w-[480px] md:h-[480px]
          relative
        "
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
          onCreated={({ gl }) => {
            // tono de color correcto para blending aditivo
            gl.setClearAlpha(0);
          }}
        >
          {/* Elegimos modo */}
          {activeMode === "wire" && (
            <NeonWireframe
              status={status}
              onClick={onClick}
              rings={wireParams.rings}
              segments={wireParams.segments}
              turnSpeed={wireParams.turnSpeed}
            />
          )}
          {activeMode === "particles" && (
            <ParticleHologram
              status={status}
              onClick={onClick}
              rings={particleParams.rings}
              segments={particleParams.segments}
              sizeBase={particleParams.size}
              additiveGlow={particleParams.glow}
            />
          )}
          {activeMode === "glitch" && (
            <GlitchHalo
              status={status}
              onClick={onClick}
              frequency={glitchParams.frequency}
              scanStrength={glitchParams.scanlines}
              glow={glitchParams.glow}
            />
          )}
        </Canvas>

        {/* Panel de control opcional */}
        {showControls && !mode && (
          <ControlPanel
            activeMode={localMode}
            setMode={setLocalMode}
            wireParams={wireParams}
            setWireParams={setWireParams}
            particleParams={particleParams}
            setParticleParams={setParticleParams}
            glitchParams={glitchParams}
            setGlitchParams={setGlitchParams}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
 *  Panel de control (Tailwind básico, sin dependencias)
 * ============================================================ */
function ControlPanel(props: {
  activeMode: HoloHaloMode;
  setMode: (m: HoloHaloMode) => void;
  wireParams: { rings: number; segments: number; turnSpeed: number };
  setWireParams: React.Dispatch<
    React.SetStateAction<{ rings: number; segments: number; turnSpeed: number }>
  >;
  particleParams: {
    rings: number;
    segments: number;
    size: number;
    glow: boolean;
  };
  setParticleParams: React.Dispatch<
    React.SetStateAction<{
      rings: number;
      segments: number;
      size: number;
      glow: boolean;
    }>
  >;
  glitchParams: { frequency: number; scanlines: number; glow: number };
  setGlitchParams: React.Dispatch<
    React.SetStateAction<{ frequency: number; scanlines: number; glow: number }>
  >;
}) {
  const {
    activeMode,
    setMode,
    wireParams,
    setWireParams,
    particleParams,
    setParticleParams,
    glitchParams,
    setGlitchParams,
  } = props;

  const Btn: React.FC<{
    label: string;
    active?: boolean;
    onClick: () => void;
  }> = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded-md border transition
      ${
        active
          ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
          : "bg-white/5 border-white/10 text-white/70 hover:text-white"
      }
      `}
    >
      {label}
    </button>
  );

  const Range: React.FC<{
    label: string;
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (v: number) => void;
  }> = ({ label, min, max, step = 1, value, onChange }) => (
    <label className="flex items-center gap-2 text-[10px] text-white/70">
      <span className="w-20">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-40 accent-cyan-400"
      />
      <span className="w-10 text-right">{Number(value).toFixed(2)}</span>
    </label>
  );

  const Check: React.FC<{
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }> = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 text-[10px] text-white/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-cyan-400"
      />
      <span>{label}</span>
    </label>
  );

  return (
    <div
      className="
        absolute left-2 bottom-2 right-2
        rounded-lg bg-black/60 backdrop-blur
        border border-white/10 p-2
        text-white
        flex flex-col gap-2
      "
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="text-white/60">Mode:</span>
        <Btn
          label="Particles"
          active={activeMode === "particles"}
          onClick={() => setMode("particles")}
        />
        <Btn
          label="Wire"
          active={activeMode === "wire"}
          onClick={() => setMode("wire")}
        />
        <Btn
          label="Glitch"
          active={activeMode === "glitch"}
          onClick={() => setMode("glitch")}
        />
      </div>

      {activeMode === "wire" && (
        <div className="grid grid-cols-2 gap-2">
          <Range
            label="Rings"
            min={8}
            max={72}
            value={wireParams.rings}
            onChange={(v) =>
              setWireParams((p) => ({ ...p, rings: Math.floor(v) }))
            }
          />
          <Range
            label="Segments"
            min={64}
            max={360}
            value={wireParams.segments}
            onChange={(v) =>
              setWireParams((p) => ({ ...p, segments: Math.floor(v) }))
            }
          />
          <Range
            label="Turn"
            min={0.05}
            max={0.6}
            step={0.01}
            value={wireParams.turnSpeed}
            onChange={(v) => setWireParams((p) => ({ ...p, turnSpeed: v }))}
          />
        </div>
      )}

      {activeMode === "particles" && (
        <div className="grid grid-cols-2 gap-2">
          <Range
            label="Rings"
            min={60}
            max={220}
            value={particleParams.rings}
            onChange={(v) =>
              setParticleParams((p) => ({ ...p, rings: Math.floor(v) }))
            }
          />
          <Range
            label="Segments"
            min={90}
            max={260}
            value={particleParams.segments}
            onChange={(v) =>
              setParticleParams((p) => ({ ...p, segments: Math.floor(v) }))
            }
          />
          <Range
            label="Size"
            min={0.8}
            max={3.0}
            step={0.1}
            value={particleParams.size}
            onChange={(v) => setParticleParams((p) => ({ ...p, size: v }))}
          />
          <Check
            label="Additive Glow"
            checked={particleParams.glow}
            onChange={(v) => setParticleParams((p) => ({ ...p, glow: v }))}
          />
        </div>
      )}

      {activeMode === "glitch" && (
        <div className="grid grid-cols-2 gap-2">
          <Range
            label="Frequency"
            min={2}
            max={12}
            step={0.1}
            value={glitchParams.frequency}
            onChange={(v) => setGlitchParams((p) => ({ ...p, frequency: v }))}
          />
          <Range
            label="Scanlines"
            min={0}
            max={1}
            step={0.05}
            value={glitchParams.scanlines}
            onChange={(v) => setGlitchParams((p) => ({ ...p, scanlines: v }))}
          />
          <Range
            label="Glow"
            min={0.2}
            max={1.0}
            step={0.05}
            value={glitchParams.glow}
            onChange={(v) => setGlitchParams((p) => ({ ...p, glow: v }))}
          />
        </div>
      )}
    </div>
  );
}

/* ============================================================
 *  Modo 1: Neon Wireframe (LineLoop por anillos)
 * ============================================================ */
function NeonWireframe({
  status,
  onClick,
  rings,
  segments,
  turnSpeed,
}: {
  status: Status;
  onClick?: () => void;
  rings: number;
  segments: number;
  turnSpeed: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const alive = useAlive();
  useSceneCleanup();

  const ringGeometries = useMemo(() => {
    const geoms: THREE.BufferGeometry[] = [];
    const R = 1.6;
    for (let i = 0; i < rings; i++) {
      const r = (R * (i + 1)) / rings;
      const pos = new Float32Array(segments * 3);
      for (let s = 0; s < segments; s++) {
        const t = (s / segments) * Math.PI * 2;
        pos[s * 3 + 0] = Math.cos(t) * r;
        pos[s * 3 + 1] = Math.sin(t) * r;
        pos[s * 3 + 2] = 0;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geoms.push(g);
    }
    return geoms;
  }, [rings, segments]);

  const materials = useMemo(() => {
    const arr: THREE.LineBasicMaterial[] = [];
    for (let i = 0; i < rings; i++) {
      const m = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(0.56 + i * 0.01, 1, 0.55),
        transparent: true,
        opacity: 0.85,
      });
      arr.push(m);
    }
    return arr;
  }, [rings]);

  const handleClick = useCallback(() => onClick?.(), [onClick]);

  useFrame((state, delta) => {
    if (!alive.current || !groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.x = THREE.MathUtils.degToRad(60);
    groupRef.current.rotation.z +=
      delta * (status === "connecting" ? turnSpeed * 1.6 : turnSpeed);
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.05;

    // color para connecting (rainbow)
    const children = groupRef.current.children as THREE.Line[];
    for (let i = 0; i < children.length; i++) {
      const mat = children[i].material as THREE.LineBasicMaterial;
      const baseOpacity =
        status === "closed" ? 0.45 : 0.65 + 0.25 * Math.sin(t * 0.8 + i * 0.4);
      mat.opacity = THREE.MathUtils.clamp(baseOpacity, 0.25, 0.95);
      if (status === "connecting") {
        const hue = (0.55 + 0.25 * Math.sin(t * 0.35 + i * 0.15)) % 1.0;
        mat.color.setHSL(hue, 1, 0.55);
      } else if (status === "open") {
        mat.color.set("#00eaff");
      } else {
        mat.color.set("#6b7280");
      }
    }
  });

  return (
    <group ref={groupRef} onClick={handleClick}>
      {ringGeometries.map((g, i) => (
        <lineLoop key={i} geometry={g} material={materials[i]} />
      ))}
    </group>
  );
}

/* ============================================================
 *  Modo 2: Particle Hologram (Points + ShaderMaterial)
 * ============================================================ */
function ParticleHologram({
  status,
  onClick,
  rings,
  segments,
  sizeBase,
  additiveGlow,
}: {
  status: Status;
  onClick?: () => void;
  rings: number;
  segments: number;
  sizeBase: number;
  additiveGlow: boolean;
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
        const theta = u * Math.PI * 2;
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
      uniform float uState; // 0=closed,1=connecting,2=open

      vec3 deform(vec3 p){
        float y = p.y;
        vec3 q = p;
        q.y *= 1.22 + 0.08 * smoothstep(-0.2,0.8,y);
        q.x *= mix(1.0,0.82, smoothstep(-0.6,-0.1,y));
        q.z *= mix(1.0,0.92, smoothstep(-0.6,-0.1,y));

        // ripple que escucha (centro móvil en Y)
        float centerY = 0.15 * sin(uTime * (0.6 + 0.5*uState));
        float r = length(q.xz);
        float phase = r*6.0 - (uTime*(0.8 + 0.6*uState)) - (q.y-centerY)*3.0;
        float wave = 0.05 * sin(phase) * smoothstep(0.0,0.9,1.0-abs(q.y));
        q += normalize(q+0.0001) * wave;
        return q;
      }

      void main(){
        vec3 h = deform(position);
        h.y += 0.05 * sin(uTime*0.9);
        vec4 mv = modelViewMatrix * vec4(h,1.0);
        gl_Position = projectionMatrix * mv;
        float base = ${sizeBase.toFixed(2)} + ${sizeBase.toFixed(
      2
    )} * smoothstep(-0.2,0.6,h.z);
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
        vec3 base = vec3(0.0,0.95,1.0);
        float ring = smoothstep(0.0,0.8,1.0-d);

        vec3 col;
        if(uState<0.5){           // closed
          col = mix(vec3(0.55), base*0.65, 0.35) * (0.35 + 0.65*ring);
        } else if(uState<1.5){    // connecting
          float hue = fract(0.55 + 0.25*sin(t*0.6) + (1.0-d)*0.25);
          col = hsv2rgb(vec3(hue, 0.95, 1.0)) * (0.55 + 0.45*ring);
        } else {                  // open
          vec3 hi = hsv2rgb(vec3(0.84,0.7,1.0));
          col = mix(base, hi, 0.30 + 0.20*sin(t*0.7)) * (0.6 + 0.4*ring);
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
      blending: additiveGlow ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    return m;
  }, [sizeBase, additiveGlow]);

  const handleClick = useCallback(() => onClick?.(), [onClick]);

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

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      onClick={handleClick}
    />
  );
}

/* ============================================================
 *  Modo 3: Glitch Halo (Mesh + Shader para scanlines/glow)
 * ============================================================ */
function GlitchHalo({
  status,
  onClick,
  frequency,
  scanStrength,
  glow,
}: {
  status: Status;
  onClick?: () => void;
  frequency: number;
  scanStrength: number; // 0..1
  glow: number; // 0.2..1.0
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const alive = useAlive();
  useSceneCleanup();

  const geometry = useMemo(() => new THREE.SphereGeometry(1.2, 128, 96), []);
  const material = useMemo(() => {
    const vert = /* glsl */ `
      precision highp float;
      varying vec3 vPos;
      uniform float uTime;
      uniform float uFreq;

      void main(){
        vPos = position;
        // sutil distorsión de superficie
        float n = sin(vPos.x*uFreq + uTime*1.2)*0.02 + sin(vPos.y*uFreq*0.8 - uTime*0.9)*0.02;
        vec3 p = position + normal * n;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `;
    const frag = /* glsl */ `
      precision highp float;
      varying vec3 vPos;
      uniform float uTime;
      uniform float uState;
      uniform float uScan;
      uniform float uGlow;

      vec3 hsv2rgb(vec3 c){
        vec3 p = abs(fract(c.xxx + vec3(0.,2./3.,1./3.))*6.-3.);
        return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
      }

      void main(){
        // normalizada -1..1
        vec3 n = normalize(vPos);

        // scanlines sobre Y (bandas)
        float scan = 0.5 + 0.5 * sin(uTime*1.2 + n.y*24.0);
        scan = pow(scan, 2.0) * uScan;

        // base de color por estado
        vec3 base;
        if(uState < 0.5){
          base = vec3(0.6, 0.66, 0.74); // gris azulado
        } else if(uState < 1.5){
          float hue = fract(0.55 + 0.25*sin(uTime*0.4) + n.y*0.25);
          base = hsv2rgb(vec3(hue, 0.95, 1.0));
        } else {
          base = vec3(0.0, 0.95, 1.0); // cian
        }

        // rim-light (glow en bordes vista)
        float rim = pow(1.0 - abs(n.z), 2.5) * uGlow;

        // mezcla final: glow + scan
        vec3 col = base * (0.35 + 0.65*rim) + scan * vec3(1.0, 0.8, 1.0);
        gl_FragColor = vec4(col, 0.85);
      }
    `;
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 2 },
        uScan: { value: scanStrength },
        uGlow: { value: glow },
        uFreq: { value: frequency },
      },
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [frequency, glow, scanStrength]);

  const handleClick = useCallback(() => onClick?.(), [onClick]);

  useFrame(({ clock }) => {
    if (!alive.current || !meshRef.current) return;
    const t = clock.getElapsedTime();
    const m = meshRef.current.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = t;
    m.uniforms.uState.value =
      status === "closed" ? 0.0 : status === "connecting" ? 1.0 : 2.0;

    meshRef.current.rotation.x = THREE.MathUtils.degToRad(60);
    meshRef.current.rotation.z = t * 0.25;
    meshRef.current.position.y = Math.sin(t * 0.6) * 0.05;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      onClick={handleClick}
    />
  );
}
