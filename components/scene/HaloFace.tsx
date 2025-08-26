"use client";
import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useAlive } from "./useAlive";
import { useSceneCleanup } from "./cleanupScene";

export type Status = "open" | "connecting" | "closed";

type HoloFaceProps = {
  status: Status;
  className?: string;
  onClick?: () => void;
  /** ruta del modelo .glb dentro de /public (default /models/holo_head.glb) */
  src?: string;
  /** tamaño objetivo en alto de la cabeza dentro de la escena (unidades world) */
  targetHeight?: number; // default 2.4
};

const DEFAULT_SRC = "/models/holo_head.glb";

/** Busca el primer Mesh en un árbol de THREE.Object3D */
function findFirstMesh(
  root: THREE.Object3D
): THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> | null {
  let found: THREE.Mesh<
    THREE.BufferGeometry,
    THREE.Material | THREE.Material[]
  > | null = null;
  root.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
  });
  return found;
}

/** Convierte HSL [0..1] a THREE.Color reusando instancia */
function setHSLReusable(
  color: THREE.Color,
  h: number,
  s: number,
  l: number
): THREE.Color {
  color.setHSL(
    ((h % 1) + 1) % 1,
    THREE.MathUtils.clamp(s, 0, 1),
    THREE.MathUtils.clamp(l, 0, 1)
  );
  return color;
}

export function HoloFace({
  status,
  className,
  onClick,
  src = DEFAULT_SRC,
  targetHeight = 2.4,
}: HoloFaceProps) {
  return (
    <div className={className}>
      {/* Canvas amplio + cámara prudente para no recortar */}
      <div
        className="w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] cursor-pointer"
        onClick={onClick}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 4.2], fov: 32 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
          }}
        >
          <FaceWire status={status} src={src} targetHeight={targetHeight} />
        </Canvas>
      </div>
    </div>
  );
}

/* ----------------- Parte interna ----------------- */

type FaceWireProps = { status: Status; src: string; targetHeight: number };

function FaceWire({ status, src, targetHeight }: FaceWireProps) {
  const { scene } = useGLTF(src);
  const alive = useAlive();
  useSceneCleanup();

  const groupRef = useRef<THREE.Group>(null!);
  const lineRef = useRef<THREE.LineSegments>(null!);

  // Prepara wireframe a partir del primer Mesh del modelo
  const { geometry, bbox, basePositions } = useMemo(() => {
    const mesh = findFirstMesh(scene);
    if (!mesh || !mesh.geometry) {
      // Geometría fallback mínima (un aro) si el modelo no carga
      const ring = new THREE.RingGeometry(0.6, 1, 64);
      const edges = new THREE.EdgesGeometry(ring);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", edges.getAttribute("position").clone());
      const bb = new THREE.Box3().setFromBufferAttribute(
        g.getAttribute("position") as THREE.BufferAttribute
      );
      return {
        geometry: g,
        bbox: bb,
        basePositions: (g.getAttribute("position") as THREE.BufferAttribute)
          .array as Float32Array,
      };
    }

    // Extrae solo bordes “duros” del mesh
    const edges = new THREE.EdgesGeometry(
      mesh.geometry as THREE.BufferGeometry,
      15
    ); // thresholdAngle=15°
    const posAttr = edges.getAttribute("position") as THREE.BufferAttribute;

    // Creamos una geometry propia para poder adjuntar colores
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", posAttr.clone());
    // Color por vértice (se rellena en runtime)
    g.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(posAttr.count * 3), 3)
    );

    const bb = new THREE.Box3().setFromBufferAttribute(posAttr);
    return {
      geometry: g,
      bbox: bb,
      basePositions: (g.getAttribute("position") as THREE.BufferAttribute)
        .array as Float32Array,
    };
  }, [scene]);

  // Material de líneas con vertexColors
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
      }),
    []
  );

  // Ajusta escala y centrado del grupo para encajar a targetHeight
  useEffect(() => {
    if (!groupRef.current) return;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const scale = targetHeight / Math.max(size.y, 1e-6);
    groupRef.current.scale.setScalar(scale);

    // Centrar en origen (X,Z) y apoyar en y=0 aprox
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    groupRef.current.position.set(
      -center.x * scale,
      -bbox.min.y * scale,
      -center.z * scale
    );
  }, [bbox, targetHeight]);

  // Animación de color y movimiento
  const baseCyan = useMemo(() => new THREE.Color("#00eaff"), []);
  const dimGray = useMemo(() => new THREE.Color("#7a7f87"), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const yRange = bbox.max.y - bbox.min.y || 1;

  useFrame((state) => {
    if (!alive.current || !lineRef.current) return;

    const t = state.clock.getElapsedTime();
    const geom = lineRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geom.getAttribute("color") as THREE.BufferAttribute;
    const positions = basePositions; // inmutable
    const colors = colAttr.array as Float32Array;

    // Efectos globales
    const pulse =
      0.8 + 0.2 * Math.sin(t * (status === "connecting" ? 2.2 : 1.8));
    (lineRef.current.material as THREE.LineBasicMaterial).opacity =
      status === "closed" ? 0.55 : pulse;

    // Pequeño vaivén holográfico
    groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.08;
    groupRef.current.position.y += Math.sin(t * 0.8) * 0.0005; // levitación sutil

    // Scan vertical ping-pong (0..1..0)
    const scanSpeed = status === "connecting" ? 0.65 : 0.35;
    const ping = (t * scanSpeed) % 2;
    const scanCenter = ping <= 1 ? ping : 2 - ping;
    const bandWidth = status === "connecting" ? 0.18 : 0.12;

    // Recoloreamos por vértice (CPU) según y-normalizado y estado
    const baseR = (status === "closed" ? dimGray : baseCyan).r;
    const baseG = (status === "closed" ? dimGray : baseCyan).g;
    const baseB = (status === "closed" ? dimGray : baseCyan).b;

    for (let i = 0; i < posAttr.count; i++) {
      const y = positions[i * 3 + 1];
      const yN = THREE.MathUtils.clamp((y - bbox.min.y) / yRange, 0, 1);

      // banda del escaneo (ventana suave alrededor de scanCenter)
      const w = bandWidth;
      const band =
        THREE.MathUtils.smoothstep(yN, scanCenter - w, scanCenter) *
        (1.0 - THREE.MathUtils.smoothstep(yN, scanCenter, scanCenter + w));

      if (status === "connecting") {
        // Rainbow sobre escaneo
        const hue = (0.55 + 0.35 * Math.sin(t * 0.4 + yN * 3.14159)) % 1.0;
        setHSLReusable(tmp, hue, 1, 0.5);
        colors[i * 3 + 0] = THREE.MathUtils.lerp(baseR, tmp.r, band);
        colors[i * 3 + 1] = THREE.MathUtils.lerp(baseG, tmp.g, band);
        colors[i * 3 + 2] = THREE.MathUtils.lerp(baseB, tmp.b, band);
      } else if (status === "open") {
        // Brillo cian con highlight blanco en la banda
        const white = 1.0;
        colors[i * 3 + 0] = THREE.MathUtils.lerp(baseR, white, band * 0.8);
        colors[i * 3 + 1] = THREE.MathUtils.lerp(baseG, white, band * 0.8);
        colors[i * 3 + 2] = THREE.MathUtils.lerp(baseB, white, band * 0.8);
      } else {
        // Cerrado: gris tenue sin scan
        colors[i * 3 + 0] = baseR;
        colors[i * 3 + 1] = baseG;
        colors[i * 3 + 2] = baseB;
      }
    }

    colAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={lineRef} geometry={geometry} material={material} />
    </group>
  );
}

// Preload para que el modelo esté en caché
useGLTF.preload(DEFAULT_SRC);
