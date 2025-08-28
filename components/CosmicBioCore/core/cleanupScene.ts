"use client";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

/**
 * Limpia geometrías, materiales y texturas al desmontar la escena.
 * Evita fugas de memoria GPU y problemas de "WebGL context lost".
 */
export function useSceneCleanup() {
  const { gl, scene } = useThree();

  useEffect(() => {
    return () => {
      scene.traverse((object: THREE.Object3D) => {
        // Solo limpiamos si es un Mesh con geometría y material
        if (!(object instanceof THREE.Mesh)) return;

        // ✅ Liberar geometría
        if (object.geometry) {
          object.geometry.dispose();
        }

        // ✅ Normalizar material a array para iterar siempre igual
        const materials: THREE.Material[] = Array.isArray(object.material)
          ? object.material
          : [object.material];

        for (const material of materials) {
          if (!material) continue;

          // Lista de texturas comunes en materiales PBR / estándar
          const textureKeys: Array<
            | "map"
            | "normalMap"
            | "roughnessMap"
            | "metalnessMap"
            | "envMap"
            | "alphaMap"
            | "emissiveMap"
            | "lightMap"
            | "aoMap"
            | "displacementMap"
          > = [
            "map",
            "normalMap",
            "roughnessMap",
            "metalnessMap",
            "envMap",
            "alphaMap",
            "emissiveMap",
            "lightMap",
            "aoMap",
            "displacementMap",
          ];

          // ✅ Liberar texturas asociadas si existen
          for (const key of textureKeys) {
            const texture = (material as THREE.MeshStandardMaterial)[key];
            if (texture instanceof THREE.Texture) {
              texture.dispose();
            }
          }

          // ✅ Liberar el material en sí
          material.dispose();
        }
      });

      // ✅ Liberar buffers y shaders del renderer
      if ("dispose" in gl && typeof gl.dispose === "function") {
        gl.dispose();
      }
    };
  }, [gl, scene]);
}
