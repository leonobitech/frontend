"use client";
import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { SPARKS_VERT, SPARKS_FRAG } from "./shaders";

type VoiceMods = Partial<{
  // deltas aditivos (se suman al valor base del material)
  smokeOpacityAdd: number;
  gridBoostAdd: number;
  levAmpAdd: number;
  edgeLiftAmpAdd: number;
  carpetWaveAmpAdd: number;
  carpetWaveHzAdd: number;
}>;

type UParams = {
  pulseHz: number;
  splashPeriod: number;
  splashPower: number;
  coreColor: THREE.Color;
  accentColor: THREE.Color;
  level: number;
  mods?: VoiceMods; // opcional: si no viene, queda 100% igual
};

// Tipado de uniforms sin usar `any`
type Uniform<T> = { value: T };
type SparksUniforms = {
  u_time: Uniform<number>;
  u_pulseHz: Uniform<number>;
  u_splashPeriod: Uniform<number>;
  u_splashPower: Uniform<number>;
  u_level: Uniform<number>;
  u_coreColor: Uniform<THREE.Color>;
  u_accentColor: Uniform<THREE.Color>;

  u_cohesion: Uniform<number>;
  u_binsTheta: Uniform<number>;
  u_binsPhi: Uniform<number>;
  u_clusterJitter: Uniform<number>;

  u_smokeRatio: Uniform<number>;
  u_smokeFlow: Uniform<number>;
  u_smokeSize: Uniform<number>;
  u_smokeOpacity: Uniform<number>;

  u_carpetSize: Uniform<number>;
  u_carpetCurl: Uniform<number>;
  u_carpetNoise: Uniform<number>;
  u_carpetWaveAmp: Uniform<number>;
  u_carpetWaveHz: Uniform<number>;

  u_gridStep: Uniform<number>;
  u_gridSoft: Uniform<number>;
  u_gridBoost: Uniform<number>;

  u_levAmp: Uniform<number>;
  u_levHz: Uniform<number>;

  u_edgeLiftAmp: Uniform<number>;
  u_edgeLiftHz: Uniform<number>;
  u_edgePhase: Uniform<number>;
};

type BaseSnapshot = {
  smokeOpacity: number;
  gridBoost: number;
  levAmp: number;
  edgeLiftAmp: number;
  carpetWaveAmp: number;
  carpetWaveHz: number;
};

export function Sparks({
  count,
  uParams,
}: {
  count: number;
  uParams: UParams;
}) {
  const alive = useAlive();
  const ptsRef =
    useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);

  const baseRef = useRef<BaseSnapshot | null>(null);

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
    const uniforms: SparksUniforms = {
      // básicos
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
      u_gridBoost: { value: 5 },

      // levitación y puntas
      u_levAmp: { value: 0.06 },
      u_levHz: { value: 0.18 },
      u_edgeLiftAmp: { value: 0.08 },
      u_edgeLiftHz: { value: 0.22 },
      u_edgePhase: { value: 0.7 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: SPARKS_VERT,
      fragmentShader: SPARKS_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms, // tipado fuerte (compatible estructuralmente con IUniforms)
    });

    // snapshot base (una vez) para aplicar deltas SIN alterar tu look
    baseRef.current = {
      smokeOpacity: uniforms.u_smokeOpacity.value,
      gridBoost: uniforms.u_gridBoost.value,
      levAmp: uniforms.u_levAmp.value,
      edgeLiftAmp: uniforms.u_edgeLiftAmp.value,
      carpetWaveAmp: uniforms.u_carpetWaveAmp.value,
      carpetWaveHz: uniforms.u_carpetWaveHz.value,
    };

    return material;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // material estable

  useFrame(({ clock }) => {
    if (!alive.current || !ptsRef.current) return;

    const material = ptsRef.current.material as THREE.ShaderMaterial & {
      uniforms: SparksUniforms;
    };
    const u = material.uniforms;

    // tiempo + básicos
    u.u_time.value = clock.elapsedTime;
    u.u_level.value = uParams.level;
    u.u_pulseHz.value = uParams.pulseHz;
    u.u_splashPeriod.value = uParams.splashPeriod;
    u.u_splashPower.value = uParams.splashPower;

    // colores (copiar para mantener referencia)
    u.u_coreColor.value.copy(uParams.coreColor);
    u.u_accentColor.value.copy(uParams.accentColor);

    // mods aditivos opcionales (si no vienen, queda el base)
    const base = baseRef.current;
    const m = uParams.mods;
    if (base && m) {
      u.u_smokeOpacity.value = base.smokeOpacity + (m.smokeOpacityAdd ?? 0);
      u.u_gridBoost.value = base.gridBoost + (m.gridBoostAdd ?? 0);
      u.u_levAmp.value = base.levAmp + (m.levAmpAdd ?? 0);
      u.u_edgeLiftAmp.value = base.edgeLiftAmp + (m.edgeLiftAmpAdd ?? 0);
      u.u_carpetWaveAmp.value = base.carpetWaveAmp + (m.carpetWaveAmpAdd ?? 0);
      u.u_carpetWaveHz.value = base.carpetWaveHz + (m.carpetWaveHzAdd ?? 0);
    }
  });

  useEffect(() => {
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  return <points ref={ptsRef} geometry={geom} material={mat} />;
}
