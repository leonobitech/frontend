// ─── Rust Embedded desde Cero — Trinario de cierre (🔁 / 🧭 / 🏔️) ───
//
// Wrapper para el remate emocional-técnico-aspiracional que cierra cada paso
// (brain §7.9). Espera exactamente 3 <Callout> hijos, típicamente con iconos
// 🔁 (patrones consolidados), 🧭 (filosofía embedded), 🏔️ (lo que viene).
//
// Todos los hijos deberían usar color="default" para el look "sin color".
//
// Uso desde MDX:
//   <Reflexion>
//     <Callout icon="🔁">Patrones que ya son parte de tu vocabulario...</Callout>
//     <Callout icon="🧭">La filosofía embedded que estás absorbiendo...</Callout>
//     <Callout icon="🏔️">Lo que viene en el paso siguiente...</Callout>
//   </Reflexion>

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ReflexionProps {
  children?: ReactNode;
  className?: string;
}

export function Reflexion({ children, className }: ReflexionProps) {
  return (
    <section
      aria-label="Reflexión del paso"
      className={cn(
        "my-16 relative",
        "border-y border-[color:var(--course-border-strong)]",
        "py-10",
        className,
      )}
    >
      <p className="course-kicker mb-6 text-center">Reflexión del paso</p>
      <div className="grid gap-5 md:grid-cols-3">{children}</div>
    </section>
  );
}
