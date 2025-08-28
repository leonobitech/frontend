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
      const r = 1.2 * Math.pow(Math.random(), 2.0); // más densidad centro
      const a = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      base[i * 3 + 0] = r * Math.sin(v) * Math.cos(a);
      base[i * 3 + 1] = r * Math.cos(v) * 0.9;
      base[i * 3 + 2] = r * Math.sin(v) * Math.sin(a);
    }

    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(base.slice(), 3)
    );
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
      uniforms: {
        u_time: { value: 0 },
        u_pulseHz: { value: uParams.pulseHz },
        u_splashPeriod: { value: uParams.splashPeriod },
        u_splashPower: { value: uParams.splashPower },
        u_level: { value: uParams.level },
        u_coreColor: { value: uParams.coreColor.clone() },
        u_accentColor: { value: uParams.accentColor.clone() },
      },
    });
  }, [uParams]);

  useFrame(({ clock }) => {
    if (!alive.current || !ptsRef.current) return;
    const { uniforms } = ptsRef.current.material;
    uniforms.u_time.value = clock.elapsedTime;
    uniforms.u_level.value = uParams.level;
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
