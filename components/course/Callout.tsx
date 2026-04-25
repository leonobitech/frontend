// ─── Rust Embedded desde Cero — Callout sobrio (manual editorial §3) ───
//
// Un único estilo neutral que matchea las cards de los `<details>` del
// cuestionario: bg surface tintado, border sutil, sin icono, sin accent line.
// Las props `type` / `color` / `icon` se preservan por compat con MDX
// existente pero no afectan el render — todos los callouts se ven iguales.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CalloutType = "info" | "warning";

interface CalloutProps {
  type?: CalloutType;
  color?: string;
  icon?: string;
  className?: string;
  children?: ReactNode;
}

export function Callout({ type = "info", className, children }: CalloutProps) {
  return (
    <div
      role="note"
      data-callout-type={type}
      className={cn(
        "my-7 rounded-lg border px-5 py-5",
        "border-[color:var(--course-border)]",
        "bg-[color:var(--course-surface)]/60",
        "text-[15px] leading-relaxed",
        // Bajamos el tono del texto interno: usa ink-soft en vez del ink
        // full del prose. Los `<p>`, `<li>`, `<strong>` heredan via specificidad.
        "[&_p]:text-[color:var(--course-ink-soft)]",
        "[&_li]:text-[color:var(--course-ink-soft)]",
        "[&_strong]:text-[color:var(--course-ink)]",
        // En mobile dejamos el texto al ras izquierda sin hyphenation —
        // el viewport estrecho con text-justify + hyphens-auto partía
        // identifiers técnicos (`sdkconfig` → `sdkcon-/fig`) y palabras
        // sueltas (`partition` → `parti-/tion`). En sm+ recuperamos el
        // justified con pretty-wrap del diseño desktop.
        "[&_p]:[text-wrap:pretty]",
        "[&_li]:[text-wrap:pretty]",
        "sm:[&_p]:text-justify sm:[&_p]:[hyphens:auto]",
        "sm:[&_li]:text-justify sm:[&_li]:[hyphens:auto]",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "space-y-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
