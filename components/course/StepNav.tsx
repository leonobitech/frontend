// ─── Rust Embedded desde Cero — Navegación prev/next entre pasos ───
//
// Cards tipográficas grandes con kicker mono, número del paso destacado y
// título en sans. El hover eleva el accent + mueve la flecha.

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { COURSE_BASE_URL, getAdjacentSteps } from "@/lib/course/steps";

interface StepNavProps {
  currentSlug: string;
  className?: string;
}

export function StepNav({ currentSlug, className }: StepNavProps) {
  const { prev, next } = getAdjacentSteps(currentSlug);

  return (
    <nav
      aria-label="Navegación entre pasos"
      className={cn(
        "mt-20 grid gap-4 border-t border-[color:var(--course-border-strong)] pt-10 sm:grid-cols-2",
        className,
      )}
    >
      {prev ? (
        <Link
          href={`${COURSE_BASE_URL}/${prev.slug}`}
          className={cn(
            "no-course-style group relative overflow-hidden",
            "rounded-lg border border-[color:var(--course-border)]",
            "bg-[color:var(--course-surface)]/50",
            "px-5 py-5 transition-all duration-300",
            "hover:border-[color:var(--course-accent)]/40",
            "hover:bg-[color:var(--course-surface)]",
          )}
        >
          <div className="flex items-center gap-2">
            <ArrowLeft
              className="size-3.5 text-[color:var(--course-ink-mute)] transition-all duration-300 group-hover:-translate-x-0.5 group-hover:text-[color:var(--course-accent)]"
              aria-hidden
            />
            <span className="course-kicker">Anterior</span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-course-mono text-xs font-semibold tabular-nums text-[color:var(--course-ink-mute)]">
              {String(prev.step).padStart(2, "0")}
            </span>
            <span className="font-course-display text-xl font-medium leading-tight tracking-tight text-[color:var(--course-ink)]">
              {prev.title}
            </span>
          </div>
        </Link>
      ) : (
        <div aria-hidden />
      )}

      {next ? (
        <Link
          href={`${COURSE_BASE_URL}/${next.slug}`}
          className={cn(
            "no-course-style group relative overflow-hidden",
            "rounded-lg border border-[color:var(--course-border)]",
            "bg-[color:var(--course-surface)]/50",
            "px-5 py-5 transition-all duration-300",
            "hover:border-[color:var(--course-accent)]/40",
            "hover:bg-[color:var(--course-surface)]",
            "sm:text-right",
          )}
        >
          <div className="flex items-center justify-end gap-2">
            <span className="course-kicker">Siguiente</span>
            <ArrowRight
              className="size-3.5 text-[color:var(--course-ink-mute)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[color:var(--course-accent)]"
              aria-hidden
            />
          </div>
          <div className="mt-3 flex items-baseline gap-3 sm:justify-end">
            <span className="font-course-mono text-xs font-semibold tabular-nums text-[color:var(--course-ink-mute)] sm:order-2">
              {String(next.step).padStart(2, "0")}
            </span>
            <span className="font-course-display text-xl font-medium leading-tight tracking-tight text-[color:var(--course-ink)] sm:order-1">
              {next.title}
            </span>
          </div>
        </Link>
      ) : (
        <div aria-hidden />
      )}
    </nav>
  );
}
