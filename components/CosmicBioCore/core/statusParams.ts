import * as THREE from "three";
import type { UIStatus } from "../CosmicBioCore";

export function useStatusParams(status: UIStatus) {
  if (status === "connecting") {
    return {
      coreColor: new THREE.Color("#1EE9FF"),
      accentColor: new THREE.Color("#FFB86B"),
    };
  }
  if (status === "open") {
    return {
      coreColor: new THREE.Color("#1624E0"),
      accentColor: new THREE.Color("#EB0EE7"),
    };
  }
  return {
    coreColor: new THREE.Color("#94A3B8"),
    accentColor: new THREE.Color("#CBD5E1"),
  };
}
