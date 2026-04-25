// ─── Rust Embedded desde Cero — Pregunta plegable del cuestionario ───
//
// Equivalente visual al <details><summary>…</summary>…</details> que el brain
// usa en las páginas Notion (§7.10). Reutiliza Radix Collapsible del design system
// existente para consistencia con el resto del frontend.
//
// Uso desde MDX:
//   <QuizItem n={1} question="¿Por qué el LED necesita RMT en vez de LEDC?">
//     Porque el timing de WS2812 requiere precisión sub-microsegundo...
//   </QuizItem>

"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface QuizItemProps {
  /** Número de la pregunta (1..N). BONUS se pasa como 0 o string externo. */
  n: number;
  /** El enunciado. Plain text; el énfasis va dentro de la respuesta. */
  question: string;
  children?: ReactNode;
  className?: string;
}

export function QuizItem({ n, question, children, className }: QuizItemProps) {
  return (
    <Collapsible
      className={cn(
        "group my-3 overflow-hidden rounded-lg",
        "border border-[color:var(--course-border)]",
        "bg-[color:var(--course-surface)]/50",
        "transition-colors",
        "hover:border-[color:var(--course-border-strong)]",
        "data-[state=open]:border-[color:var(--course-accent)]/30",
        "data-[state=open]:bg-[color:var(--course-surface)]",
        className,
      )}
    >
      <CollapsibleTrigger
        aria-label={`Pregunta ${n}: ${question}`}
        className={cn(
          "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--course-accent)]/40",
        )}
      >
        <span
          className={cn(
            "mt-0.5 shrink-0 font-course-mono text-[11px] font-semibold uppercase tracking-wider",
            "text-[color:var(--course-ink-mute)]",
            "group-data-[state=open]:text-[color:var(--course-accent)]",
          )}
          aria-hidden
        >
          Q{String(n).padStart(2, "0")}
        </span>
        <span className="flex-1 font-medium leading-relaxed text-[color:var(--course-ink)]">
          {question}
        </span>
        <ChevronRight
          className={cn(
            "mt-0.5 size-4 shrink-0 transition-transform duration-300",
            "text-[color:var(--course-ink-mute)]",
            "group-data-[state=open]:rotate-90",
            "group-data-[state=open]:text-[color:var(--course-accent)]",
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "border-t border-[color:var(--course-border)]",
          "px-5 py-4",
          "text-[15px] leading-relaxed text-[color:var(--course-ink-soft)]",
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
