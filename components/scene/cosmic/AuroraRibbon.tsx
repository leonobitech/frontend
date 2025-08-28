"use client";
import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAlive } from "./useAlive";
import { RIBBON_VERT, RIBBON_FRAG } from "./shaders";

export function AuroraRibbon({
  L,
  W,
  uParams,
}: {
  L: number;
  W: number;
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
  const meshRef =
    useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);

  const geom = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts = (L + 1) * (W + 1);
    const pos = new Float32Array(verts * 3);
    const aS = new Float32Array(verts);
    const aU = new Float32Array(verts);

    let i = 0;
    for (let iy = 0; iy <= W; iy++) {
      const u = -1 + (2 * iy) / W;
      for (let ix = 0; ix <= L; ix++) {
        const s = ix / L;
        const idx = i++;
        aS[idx] = s;
        aU[idx] = u;
      }
    }

    const indices: number[] = [];
    for (let iy = 0; iy < W; iy++) {
      for (let ix = 0; ix < L; ix++) {
        const a = iy * (L + 1) + ix;
        const b = a + 1;
        const c = (iy + 1) * (L + 1) + ix;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("aS", new THREE.Float32BufferAttribute(aS, 1));
    geo.setAttribute("aU", new THREE.Float32BufferAttribute(aU, 1));
    geo.setIndex(indices);
    return geo;
  }, [L, W]);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: RIBBON_VERT,
      fragmentShader: RIBBON_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        u_time: { value: 0 },
        u_pulseHz: { value: uParams.pulseHz },
        u_splashPeriod: { value: uParams.splashPeriod },
        u_splashPower: { value: uParams.splashPower },
        u_level: { value: uParams.level },
        u_eps: { value: 1 / Math.max(1, L) },
        u_coreColor: { value: uParams.coreColor.clone() },
        u_accentColor: { value: uParams.accentColor.clone() },
      },
    });
  }, [L, uParams]);

  useFrame(({ clock }) => {
    if (!alive.current || !meshRef.current) return;
    const { uniforms } = meshRef.current.material;
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

  return <mesh ref={meshRef} geometry={geom} material={mat} />;
}
