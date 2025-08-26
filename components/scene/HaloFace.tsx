"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type HoloFaceLatheProps = {
  status: Status;
  className?: string;
  onClick?: () => void;
  height?: number; // alto del busto en unidades
  segments?: number; // resolución angular
  baseColor?: THREE.ColorRepresentation;
};

export function HoloFace({
  status,
  className,
  onClick,
  height = 2.6,
  segments = 160,
  baseColor = "#00eaff",
}: HoloFaceLatheProps) {
  return (
    <div className={className}>
      <div
        className="w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] cursor-pointer"
        onClick={onClick}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 4.6], fov: 32 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <LatheWire
            status={status}
            height={height}
            segments={segments}
            baseColor={baseColor}
          />
        </Canvas>
      </div>
    </div>
  );
}

/* ----------------- Interno ----------------- */

function LatheWire({
  status,
  height,
  segments,
  baseColor,
}: {
  status: Status;
  height: number;
  segments: number;
  baseColor: THREE.ColorRepresentation;
}) {
  const ref = useRef<THREE.LineSegments>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const alive = useAlive();
  useSceneCleanup();

  // Perfil del busto (radio, y). Ajustado para cuello + cabeza + hombros.
  const geometry = useMemo(() => {
    const h = height;
    const y0 = -h * 0.6; // base pecho
    const y1 = -h * 0.35; // cuello
    const y2 = -h * 0.15; // quijada
    const y3 = h * 0.05; // mejilla
    const y4 = h * 0.28; // frente media
    const y5 = h * 0.45; // coronilla

    const pts: THREE.Vector2[] = [];
    // pecho → hombros
    pts.push(new THREE.Vector2(0.0, y0));
    pts.push(new THREE.Vector2(1.2, y0 + h * 0.1));
    // cuello
    pts.push(new THREE.Vector2(0.4, y1));
    // mandíbula / quijada
    pts.push(new THREE.Vector2(0.65, y2));
    // mejillas
    pts.push(new THREE.Vector2(0.6, y3));
    // frente
    pts.push(new THREE.Vector2(0.5, y4));
    // coronilla (cierra arriba)
    pts.push(new THREE.Vector2(0.1, y5));
    pts.push(new THREE.Vector2(0.0, y5 + 0.01));

    const lathe = new THREE.LatheGeometry(pts, segments);

    // Wireframe “limpio” con triángulos
    const wf = new THREE.WireframeGeometry(lathe);
    // Añadimos atributo color
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      (wf.getAttribute("position") as THREE.BufferAttribute).clone()
    );
    g.setAttribute(
      "color",
      new THREE.BufferAttribute(
        new Float32Array(wf.getAttribute("position").count * 3),
        3
      )
    );
    return g;
  }, [height, segments]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
      }),
    []
  );

  const base = useMemo(() => new THREE.Color(baseColor), [baseColor]);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!alive.current || !ref.current) return;
    const t = state.clock.getElapsedTime();

    // Opacidad con pulso
    const pulse =
      0.8 + 0.2 * Math.sin(t * (status === "connecting" ? 2.2 : 1.8));
    (ref.current.material as THREE.LineBasicMaterial).opacity =
      status === "closed" ? 0.55 : pulse;

    // Giro y levitación sutil
    groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.08;
    groupRef.current.position.y = Math.sin(t * 0.6) * 0.06;

    // Escaneo vertical/rainbow
    const geom = ref.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geom.getAttribute("color") as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;

    // Encontrar min/max Y para normalizar
    let minY = Infinity,
      maxY = -Infinity;
    for (let i = 1; i < pos.length; i += 3) {
      const y = pos[i];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const range = Math.max(maxY - minY, 1e-6);

    const scanSpeed = status === "connecting" ? 0.65 : 0.35;
    const ping = (t * scanSpeed) % 2;
    const scanCenter = ping <= 1 ? ping : 2 - ping;
    const bandWidth = status === "connecting" ? 0.18 : 0.12;

    for (let i = 0; i < posAttr.count; i++) {
      const y = pos[i * 3 + 1];
      const yN = (y - minY) / range;

      const w = bandWidth;
      const band =
        THREE.MathUtils.smoothstep(yN, scanCenter - w, scanCenter) *
        (1.0 - THREE.MathUtils.smoothstep(yN, scanCenter, scanCenter + w));

      if (status === "connecting") {
        const hue = (0.55 + 0.35 * Math.sin(t * 0.4 + yN * Math.PI)) % 1.0;
        tmp.setHSL(hue, 1, 0.5);
        col[i * 3 + 0] = THREE.MathUtils.lerp(base.r, tmp.r, band);
        col[i * 3 + 1] = THREE.MathUtils.lerp(base.g, tmp.g, band);
        col[i * 3 + 2] = THREE.MathUtils.lerp(base.b, tmp.b, band);
      } else if (status === "open") {
        const white = 1.0;
        col[i * 3 + 0] = THREE.MathUtils.lerp(base.r, white, band * 0.8);
        col[i * 3 + 1] = THREE.MathUtils.lerp(base.g, white, band * 0.8);
        col[i * 3 + 2] = THREE.MathUtils.lerp(base.b, white, band * 0.8);
      } else {
        col[i * 3 + 0] = base.r;
        col[i * 3 + 1] = base.g;
        col[i * 3 + 2] = base.b;
      }
    }

    colAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={ref} geometry={geometry} material={material} />
    </group>
  );
}
