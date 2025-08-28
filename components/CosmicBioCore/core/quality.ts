export type Quality = "low" | "med" | "high" | "ultra";

export function countsByQuality(q?: Quality) {
  if (q === "low") return { ribbonL: 120, ribbonW: 14, sparks: 1200 };
  if (q === "high") return { ribbonL: 220, ribbonW: 22, sparks: 4000 };
  if (q === "ultra") return { ribbonL: 320, ribbonW: 26, sparks: 7000 };
  return { ribbonL: 180, ribbonW: 18, sparks: 1800 }; // "med"
}
