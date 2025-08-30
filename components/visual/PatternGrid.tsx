"use client";

import React from "react";

export default function PatternGrid({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 -z-10 rounded-2xl overflow-hidden",
        // Mantiene tu máscara radial base
        "[mask-image:radial-gradient(120%_80%_at_50%_45%,black,transparent_85%)]",
        className,
      ].join(" ")}
      aria-hidden
    >
      {/* Capa 1: gradiente vertical MUY sutil para dar profundidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />

      {/* Capa 2: patrón de puntos monocromo */}
      <svg className="absolute inset-0 h-full w-full text-white/12" aria-hidden>
        <defs>
          <pattern
            id="dots"
            x="0"
            y="0"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Capa 3: halo diagonal (muy leve) */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_70%_30%,rgba(99,102,241,0.08),transparent_65%)]" />

      {/* Capa 4: desvanecido inferior ultra-sutil */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent via-black/10 to-black/30" />
    </div>
  );
}
