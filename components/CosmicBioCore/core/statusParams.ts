import * as THREE from "three";
import type { UIStatus } from "../CosmicBioCore";

export function useStatusParams(status: UIStatus) {
  if (status === "connecting") {
    return {
      pulseHz: 1.15,
      splashPeriod: 2.1,
      splashPower: 1.0,
      coreColor: new THREE.Color("#1EE9FF"),
      accentColor: new THREE.Color("#FFB86B"),
    };
  }
  if (status === "open") {
    return {
      pulseHz: 0.5,
      splashPeriod: 0,
      splashPower: 0,
      coreColor: new THREE.Color("#1624E0"),
      accentColor: new THREE.Color("#EB0EE7"),
    };
  }
  return {
    pulseHz: 0.25,
    splashPeriod: 999.0,
    splashPower: 0.15,
    coreColor: new THREE.Color("#94A3B8"),
    accentColor: new THREE.Color("#CBD5E1"),
  };
}
