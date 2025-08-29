export type Quality = "low" | "med" | "high" | "ultra";

export function countsByQuality(q?: Quality) {
  if (q === "low") return { sparks: 6000 };
  if (q === "med") return { sparks: 16000 };
  if (q === "high") return { sparks: 28000 };
  if (q === "ultra") return { sparks: 40000 };
  return { sparks: 16000 }; // "med"
}
