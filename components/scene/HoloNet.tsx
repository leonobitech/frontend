"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type HoloNetProps = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** Tamaño del plano en unidades */
  size?: number; // default 4
  /** Subdivisiones (calidad de la malla) */
  segments?: number; // default 120
};

/**
 * Malla wireframe flotante con onda animada y banda rainbow de “estrés”.
 * - CSP-safe (sin assets externos).
 * - TS estricto, sin `any`.
 * - `status` modula la animación y el color.
 */
export function HoloNet({
  status,
  className,
  onClick,
  size = 4,
  segments = 120,
}: HoloNetProps) {
  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      <div className="w-[260px] h-[260px] cursor-pointer" onClick={onClick}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5.0], fov: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
          }}
        >
          {/* Environment LOCAL (sin descargas) para dar presencia al scene */}
          <Environment resolution={64} frames={1} background={false}>
            <Lightformer
              form="ring"
              intensity={1.2}
              color="#ffffff"
              scale={[3, 3, 1]}
              position={[0, 0, 2]}
            />
            <Lightformer
              intensity={0.6}
              color="#9ec5ff"
              scale={[4, 1, 1]}
              position={[2, 1, -2]}
              rotation={[0, -Math.PI / 4, 0]}
            />
            <Lightformer
              intensity={0.6}
              color="#ffd1d1"
              scale={[4, 1, 1]}
              position={[-2, -1, -2]}
              rotation={[0, Math.PI / 4, 0]}
            />
          </Environment>

          <Net size={size} segments={segments} status={status} />
        </Canvas>
      </div>
    </div>
  );
}

/* ---------- Parte interna (malla + shader) ---------- */

type NetProps = { size: number; segments: number; status: Status };

function Net({ size, segments, status }: NetProps) {
  const meshRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(
    null!
  );
  const alive = useAlive();
  useSceneCleanup();

  // Plano subdividido; orientado en XY, desplazamos en Z
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(size, size, segments, segments),
    [size, segments]
  );

  // ShaderMaterial con wireframe y uniforms animables
  const material = useMemo(() => {
    const hsv2rgb = `
      vec3 hsv2rgb(vec3 c){
        vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0 );
        return c.z * mix( vec3(1.0), rgb, c.y );
      }
    `;

    const vertex = `
      uniform float uTime;
      uniform float uAmp;
      uniform float uFreq;
      uniform float uSpeed;
      uniform float uBend;
      varying float vStress;

      void main() {
        vec3 pos = position;
        float r = length(pos.xy);
        float wave = sin(r * uFreq - uTime * uSpeed);

        // Curvatura base opcional (levitación)
        float bend = uBend * (pos.x * pos.x + pos.y * pos.y);
        float z = wave * uAmp - bend;

        vStress = abs(wave);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.x, pos.y, z, 1.0);
      }
    `;

    const fragment = `
      precision mediump float;
      uniform float uTime;
      uniform vec3  uBaseColor;     // gris metalizado
      uniform float uRainbowWidth;  // ancho de banda
      uniform float uRainbowStrength; // 0..1 fuerza del arcoíris
      varying float vStress;

      ${hsv2rgb}

      void main() {
        // Ventana alrededor de la zona de mayor stress
        float center = 0.85;
        float width = uRainbowWidth;
        float band = smoothstep(center - width, center, vStress) *
                     (1.0 - smoothstep(center, center + width, vStress));

        // Arcoíris animado
        float hue = fract(0.6 + 0.2 * sin(uTime * 0.3 + vStress * 3.1415926));
        vec3 rainbow = hsv2rgb(vec3(hue, 0.8, 1.0));

        vec3 color = mix(uBaseColor, rainbow, band * uRainbowStrength);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: 0.35 }, // amplitud de la onda
        uFreq: { value: 6.0 }, // frecuencia radial
        uSpeed: { value: 1.2 }, // velocidad
        uBend: { value: 0.02 }, // curvatura base
        uRainbowWidth: { value: 0.12 }, // ancho de la banda
        uRainbowStrength: { value: 1.0 }, // intensidad del arcoíris
        uBaseColor: { value: new THREE.Color(0x9aa0a6) }, // gris metalizado
      },
      wireframe: true,
    });

    return mat;
  }, []);

  // Targets según estado para transiciones suaves
  const targets = useRef({
    amp: 0.35,
    speed: 1.2,
    rainbowWidth: 0.12,
    rainbowStrength: 1.0,
    bend: 0.02,
  });

  // Animación + transición por estado
  useFrame((state, delta) => {
    if (!alive.current || !meshRef.current) return;

    const mat = meshRef.current.material;
    const t = state.clock.elapsedTime;

    // Definir objetivos por estado
    if (status === "open") {
      targets.current.amp = 0.35;
      targets.current.speed = 1.2;
      targets.current.rainbowWidth = 0.12;
      targets.current.rainbowStrength = 1.0;
      targets.current.bend = 0.02;
    } else if (status === "connecting") {
      // Pulso en amplitud
      targets.current.amp = 0.25 + Math.sin(t * 1.5) * 0.08;
      targets.current.speed = 1.6;
      targets.current.rainbowWidth = 0.18;
      targets.current.rainbowStrength = 0.9;
      targets.current.bend = 0.02;
    } else {
      // closed → casi plano, casi sin arcoíris
      targets.current.amp = 0.1;
      targets.current.speed = 0.6;
      targets.current.rainbowWidth = 0.08;
      targets.current.rainbowStrength = 0.15;
      targets.current.bend = 0.02;
    }

    // Lerp suave hacia objetivos
    const lerp = THREE.MathUtils.lerp;
    mat.uniforms.uTime.value += delta;
    mat.uniforms.uAmp.value = lerp(
      mat.uniforms.uAmp.value,
      targets.current.amp,
      delta * 3
    );
    mat.uniforms.uSpeed.value = lerp(
      mat.uniforms.uSpeed.value,
      targets.current.speed,
      delta * 3
    );
    mat.uniforms.uRainbowWidth.value = lerp(
      mat.uniforms.uRainbowWidth.value,
      targets.current.rainbowWidth,
      delta * 3
    );
    mat.uniforms.uRainbowStrength.value = lerp(
      mat.uniforms.uRainbowStrength.value,
      targets.current.rainbowStrength,
      delta * 3
    );
    mat.uniforms.uBend.value = lerp(
      mat.uniforms.uBend.value,
      targets.current.bend,
      delta * 3
    );

    // “Levitar”: orientación y respiración leve
    meshRef.current.rotation.x = THREE.MathUtils.degToRad(60);
    meshRef.current.rotation.z += delta * 0.15;
    const s = 1.0 + Math.sin(t * 0.8) * 0.015;
    meshRef.current.scale.set(s, s, 1);
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}
