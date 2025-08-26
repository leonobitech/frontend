"use client";
import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useSceneCleanup } from "./cleanupScene";

export function HoloFace({
  status,
}: {
  status: "open" | "connecting" | "closed";
}) {
  const { scene } = useGLTF("/models/human_face.glb"); // colocamos tu modelo aquí
  const meshRef = useRef<THREE.LineSegments>(null!);
  useSceneCleanup();

  // Wireframe del modelo
  const edges = new THREE.EdgesGeometry(
    (scene.children[0] as THREE.Mesh).geometry
  );
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color("#00eaff"),
    transparent: true,
    opacity: 0.9,
  });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      // Pulsación de intensidad
      const pulse = 0.7 + 0.3 * Math.sin(t * 2);
      (meshRef.current.material as THREE.LineBasicMaterial).opacity = pulse;

      // Color reactivo según estado
      if (status === "connecting") {
        const hue = (t * 0.2) % 1;
        (meshRef.current.material as THREE.LineBasicMaterial).color.setHSL(
          hue,
          1,
          0.5
        );
      } else {
        (meshRef.current.material as THREE.LineBasicMaterial).color.set(
          "#00eaff"
        );
      }

      // Giro lento para efecto holográfico
      meshRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
    }
  });

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 3.6], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 2, 3]} intensity={0.7} />
      <lineSegments ref={meshRef} geometry={edges} material={material} />
    </Canvas>
  );
}
