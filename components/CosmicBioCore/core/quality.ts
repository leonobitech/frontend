export type Quality = "low" | "med" | "high" | "ultra";

export function countsByQuality(q?: Quality) {
  if (q === "low") return { sparks: 20000 };
  if (q === "med") return { sparks: 40000 };
  if (q === "high") return { sparks: 70000 };
  if (q === "ultra") return { sparks: 100000 };
  return { sparks: 40000 };
}
