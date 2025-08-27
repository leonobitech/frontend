// components/scene/CosmicBioCore.tsx
"use client";

import React, { useMemo, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export type UIStatus = "open" | "connecting" | "closed";

type Props = {
  status: UIStatus;
  onClick?: () => void;
};

/* ====================== STATUS DRIVER ====================== */
function useStatusDriver(status: UIStatus) {
  const kRef = useRef(0);
  useEffect(() => {
    kRef.current = status === "closed" ? 0 : status === "connecting" ? 1 : 2;
  }, [status]);
  return kRef;
}

/* ====================== COMPONENTE PRINCIPAL ====================== */
export function CosmicBioCore({ status, onClick }: Props) {
  return (
    <div className="relative w-96 h-96">
      <Canvas
        className="absolute inset-0"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[4, 6, 6]} intensity={1.4} />
        <Scene status={status} onClick={onClick} />
      </Canvas>
    </div>
  );
}

/* ====================== ESCENA PRINCIPAL ====================== */
function Scene({
  status,
  onClick,
}: {
  status: UIStatus;
  onClick?: () => void;
}) {
  const group = useRef<THREE.Group | null>(null);
  const kRef = useStatusDriver(status);
  const handleClick = useCallback(() => onClick?.(), [onClick]);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;

    const t = clock.getElapsedTime();
    const k = kRef.current;

    const scale =
      1 + THREE.MathUtils.lerp(0.05, 0.18, k / 2) * Math.sin(t * (1 + 0.4 * k));
    g.scale.setScalar(scale);
    g.rotation.y = t * (0.08 + 0.06 * k);
  });

  return (
    <group ref={group} onClick={handleClick}>
      <MolecularCore status={status} />
      <DustField status={status} />
      <EnergySparks status={status} />
      <AuroraHalo status={status} />
    </group>
  );
}

/* ====================== MOLECULAR CORE ====================== */
function MolecularCore({ status }: { status: UIStatus }) {
  const groupRef = useRef<THREE.Group | null>(null);
  const kRef = useStatusDriver(status);
  const NODE_COUNT = 12;

  const data = useMemo(() => {
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ),
      size: 0.08 + Math.random() * 0.12,
      jitter: new THREE.Vector3(
        Math.random() * 0.3 - 0.15,
        Math.random() * 0.3 - 0.15,
        Math.random() * 0.3 - 0.15
      ),
    }));

    // conexiones entre nodos con curvas suaves
    const edgeFlatPositions: Float32Array[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (Math.random() < 0.35) {
          const a = nodes[i].position;
          const b = nodes[j].position;
          const mid = a
            .clone()
            .lerp(b, 0.5)
            .add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
              )
            );
          const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
          const pts = curve.getPoints(24);
          const flat = new Float32Array(pts.length * 3);
          for (let k = 0; k < pts.length; k++) {
            const p = pts[k];
            flat[k * 3 + 0] = p.x;
            flat[k * 3 + 1] = p.y;
            flat[k * 3 + 2] = p.z;
          }
          edgeFlatPositions.push(flat);
        }
      }
    }

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
    });

    const lineObjects = edgeFlatPositions.map((flat) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(flat, 3));
      const ln = new THREE.Line(g, lineMat);
      ln.frustumCulled = false;
      return ln;
    });

    return { nodes, lineObjects, lineMat };
  }, []);

  useEffect(() => {
    return () => {
      data.lineObjects.forEach((ln) => ln.geometry.dispose());
      data.lineMat.dispose();
    };
  }, [data]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;

    const t = clock.getElapsedTime();
    const k = kRef.current;

    let idx = 0;
    for (const child of g.children) {
      // filtramos los <primitive> de líneas
      // @ts-expect-error narrow runtime
      if (child.isMesh) {
        const m = child as THREE.Mesh;
        const mat = m.material as THREE.MeshStandardMaterial;
        const n = data.nodes[idx++];

        const pulseAmp = THREE.MathUtils.lerp(0.12, 0.35, k / 2);
        const pulse = 1 + pulseAmp * Math.sin(t * (2.3 + 0.7 * k) + idx * 0.6);
        m.scale.setScalar(pulse * (0.9 + n.size));

        // micro desplazamiento → jitter respiratorio
        m.position.set(
          n.position.x + 0.05 * Math.sin(t * 1.7 + n.jitter.x),
          n.position.y + 0.05 * Math.cos(t * 1.3 + n.jitter.y),
          n.position.z + 0.05 * Math.sin(t * 1.1 + n.jitter.z)
        );

        const hue = (t * (10 + 8 * k) + idx * 35) % 360;
        mat.color.setHSL(hue / 360, 0.85, 0.6);
        mat.emissive.setHSL(hue / 360, 0.8, 0.55);
        mat.emissiveIntensity =
          0.8 + THREE.MathUtils.lerp(0.4, 1.1, k / 2) * Math.sin(t * 3 + idx);
      }
    }

    // filamentos respiran también
    (data.lineMat as THREE.LineBasicMaterial).opacity =
      0.2 +
      THREE.MathUtils.lerp(0.15, 0.35, k / 2) * (0.7 + 0.3 * Math.sin(t * 1.4));
  });

  return (
    <group ref={groupRef}>
      {data.nodes.map((n, i) => (
        <mesh key={`node-${i}`} position={n.position}>
          <sphereGeometry args={[n.size, 16, 16]} />
          <meshStandardMaterial
            color="#00eaff"
            emissive="#ffffff"
            emissiveIntensity={1.2}
            metalness={0.1}
            roughness={0.35}
          />
        </mesh>
      ))}
      {data.lineObjects.map((obj, i) => (
        <primitive key={`edge-${i}`} object={obj} />
      ))}
    </group>
  );
}

/* ====================== POLVO CÓSMICO ====================== */
function DustField({ status }: { status: UIStatus }) {
  const ref = useRef<THREE.Points | null>(null);
  const kRef = useStatusDriver(status);
  const COUNT = 2500;

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.02,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color(0xffffff),
        opacity: 0.35,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ clock }) => {
    const p = ref.current;
    if (!p) return;

    const t = clock.getElapsedTime();
    const k = kRef.current;
    p.rotation.y = t * 0.02 * (1 + 0.5 * k);
    (p.material as THREE.PointsMaterial).opacity =
      0.18 + THREE.MathUtils.lerp(0.1, 0.25, k / 2);
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

/* ====================== CHISPAS DE ENERGÍA ====================== */
function EnergySparks({ status }: { status: UIStatus }) {
  const ref = useRef<THREE.Points | null>(null);
  const kRef = useStatusDriver(status);
  const COUNT = 300;

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 1.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.04,
        transparent: true,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color(0x00eaff),
        opacity: 0.8,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ clock }) => {
    const p = ref.current;
    if (!p) return;

    const t = clock.getElapsedTime();
    const k = kRef.current;
    p.rotation.y = t * 0.1 * (1 + 0.4 * k);
    const mat = p.material as THREE.PointsMaterial;
    const hue = (t * (50 + 30 * k)) % 360;
    mat.color.setHSL(hue / 360, 0.9, 0.65);
    mat.opacity = 0.5 + 0.4 * Math.sin(t * (2 + k));
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

/* ====================== HALO AURORAL ====================== */
function AuroraHalo({ status }: { status: UIStatus }) {
  const ref = useRef<THREE.Mesh | null>(null);
  const kRef = useStatusDriver(status);

  const geo = useMemo(() => new THREE.RingGeometry(2.4, 2.7, 64), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;

    const t = clock.getElapsedTime();
    const k = kRef.current;
    const mb = m.material as THREE.MeshBasicMaterial;
    const hue = (t * (10 + 8 * k)) % 360;
    mb.color.setHSL(hue / 360, 0.6, 0.5);
    mb.opacity = 0.12 + THREE.MathUtils.lerp(0.06, 0.18, k / 2);
    m.rotation.x = Math.PI / 2;
    m.rotation.z = t * (0.05 + 0.04 * k);
  });

  return <mesh ref={ref} geometry={geo} material={mat} />;
}
