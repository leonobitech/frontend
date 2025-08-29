"use client";
import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { SPARKS_VERT, SPARKS_FRAG } from "./shaders";

export function Sparks({
  count,
  uParams,
}: {
  count: number;
  uParams: {
    pulseHz: number;
    splashPeriod: number;
    splashPower: number;
    coreColor: THREE.Color;
    accentColor: THREE.Color;
    level: number;
  };
}) {
  const alive = useAlive();
  const ptsRef =
    useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const base = new Float32Array(count * 3);
    const seed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      seed[i] = Math.random();

      // Más densidad en el núcleo y cobertura 4π
      const r = Math.pow(Math.random(), 5.0);
      const a = Math.random() * Math.PI * 2.0;
      const v = Math.acos(2 * Math.random() - 1);

      base[i * 3 + 0] = r * Math.sin(v) * Math.cos(a);
      base[i * 3 + 1] = r * Math.cos(v) * 0.9;
      base[i * 3 + 2] = r * Math.sin(v) * Math.sin(a);
    }

    g.setAttribute("position", new THREE.Float32BufferAttribute(base, 3));
    g.setAttribute("aBase", new THREE.Float32BufferAttribute(base, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: SPARKS_VERT,
      fragmentShader: SPARKS_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      // Si la esfera se clipea al borde del canvas, descomenta:
      // depthTest: true,
      // polygonOffset: true,
      // polygonOffsetFactor: -1,
      uniforms: {
        // básicos ya existentes...
        u_time: { value: 0 },
        u_pulseHz: { value: uParams.pulseHz },
        u_splashPeriod: { value: uParams.splashPeriod },
        u_splashPower: { value: uParams.splashPower },
        u_level: { value: uParams.level },
        u_coreColor: { value: uParams.coreColor.clone() },
        u_accentColor: { value: uParams.accentColor.clone() },

        // cohesión
        u_cohesion: { value: 0.45 },
        u_binsTheta: { value: 28 },
        u_binsPhi: { value: 14 },
        u_clusterJitter: { value: 0.012 },

        // humo
        u_smokeRatio: { value: 0.26 },
        u_smokeFlow: { value: 0.6 },
        u_smokeSize: { value: 1.6 },
        u_smokeOpacity: { value: 0.3 },

        // alfombra
        u_carpetSize: { value: 0.95 },
        u_carpetCurl: { value: 0.28 },
        u_carpetNoise: { value: 0.05 },
        u_carpetWaveAmp: { value: 0.1 },
        u_carpetWaveHz: { value: 0.6 },

        // grid
        u_gridStep: { value: 0.12 },
        u_gridSoft: { value: 0.015 },
        u_gridBoost: { value: 30 },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // el material no se recrea; actualizamos sus uniforms en el frame

  useFrame(({ clock }) => {
    if (!alive.current || !ptsRef.current) return;
    const { uniforms } = ptsRef.current.material;

    uniforms.u_time.value = clock.elapsedTime;
    uniforms.u_level.value = uParams.level;

    // Actualiza también estos si cambian en runtime:
    uniforms.u_pulseHz.value = uParams.pulseHz;
    uniforms.u_splashPeriod.value = uParams.splashPeriod;
    uniforms.u_splashPower.value = uParams.splashPower;

    // Colores (copiar para no perder la referencia del uniform)
    (uniforms.u_coreColor.value as THREE.Color).copy(uParams.coreColor);
    (uniforms.u_accentColor.value as THREE.Color).copy(uParams.accentColor);
  });

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  return <points ref={ptsRef} geometry={geom} material={mat} />;
}
