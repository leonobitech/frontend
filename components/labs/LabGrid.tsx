"use client";
import LabTile from "./LabTile";
import type { LabItem } from "@/data/labs";

export default function LabGrid({ items }: { items: LabItem[] }) {
  const sorted = [...items].sort((a, b) => {
    const fa = a.featured ? -1 : 0;
    const fb = b.featured ? -1 : 0;
    if (fa !== fb) return fa - fb;
    return (a.order ?? 999) - (b.order ?? 999);
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((lab) => (
        <LabTile key={lab.id} lab={lab} />
      ))}
    </div>
  );
}
