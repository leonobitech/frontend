import * as THREE from "three";
import type { UIStatus } from "../CosmicBioCore";

export type StatusColors = {
  coreColor: THREE.Color;
  accentColor: THREE.Color;
};

export type StatusDynamics = {
  // Ritmo base
  pulseHz: number;
  splashPeriod: number;
  splashPower: number;
  // Ondas “alfombra”
  carpetWaveAmp: number;
  carpetWaveHz: number;
  carpetRadAmp: number;
  carpetRadHz: number;
  // Levitación / puntas
  levAmp: number;
  edgeLiftAmp: number;
  // Humo / grid
  smokeOpacity: number;
  smokeRatio: number;
  gridBoost: number;
};

export type StatusParams = StatusColors & { base: StatusDynamics };

/**
 * Devuelve los colores por estado (como antes) y además un bloque `base`
 * con parámetros dinámicos por estado que podés modular con el mic.
 *
 * Uso actual compatible:
 *   const { coreColor, accentColor } = useStatusParams(status);
 *
 * Uso extendido (opcional):
 *   const { base } = useStatusParams(status);
 *   // luego mezclás `base` con el factor de voz para derivar uniforms
 */
export function useStatusParams(status: UIStatus): StatusParams {
  if (status === "connecting") {
    return {
      coreColor: new THREE.Color("#1EE9FF"),
      accentColor: new THREE.Color("#FFB86B"),
      base: {
        pulseHz: 0.8,
        splashPeriod: 3.6,
        splashPower: 0.16,
        carpetWaveAmp: 0.08,
        carpetWaveHz: 0.7,
        carpetRadAmp: 0.05,
        carpetRadHz: 0.4,
        levAmp: 0.05,
        edgeLiftAmp: 0.06,
        smokeOpacity: 0.22,
        smokeRatio: 0.22,
        gridBoost: 0.45,
      },
    };
  }

  if (status === "open") {
    return {
      coreColor: new THREE.Color("#1624E0"),
      accentColor: new THREE.Color("#EB0EE7"),
      base: {
        pulseHz: 0.4,
        splashPeriod: 5.0,
        splashPower: 0.12,
        carpetWaveAmp: 0.06,
        carpetWaveHz: 0.55,
        carpetRadAmp: 0.04,
        carpetRadHz: 0.35,
        levAmp: 0.04,
        edgeLiftAmp: 0.05,
        smokeOpacity: 0.18,
        smokeRatio: 0.18,
        gridBoost: 0.4,
      },
    };
  }

  // closed (idle)
  return {
    coreColor: new THREE.Color("#94A3B8"),
    accentColor: new THREE.Color("#CBD5E1"),
    base: {
      pulseHz: 0.18,
      splashPeriod: 6.5,
      splashPower: 0.06,
      carpetWaveAmp: 0.035,
      carpetWaveHz: 0.45,
      carpetRadAmp: 0.02,
      carpetRadHz: 0.25,
      levAmp: 0.025,
      edgeLiftAmp: 0.035,
      smokeOpacity: 0.14,
      smokeRatio: 0.16,
      gridBoost: 0.3,
    },
  };
}
