// ─── Rust Embedded from Zero — Navegación prev/next entre pasos ───
//
// Cards tipográficas grandes con kicker mono, número del paso destacado y
// título en sans. El hover eleva el accent + mueve la flecha.

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { getAdjacentSteps, getStepTitle } from "@/lib/course/steps";
import { getStepUrl } from "@/lib/course/routing";
import { t, type Locale } from "@/lib/course/i18n";

interface StepNavProps {
  /** Slug ES canónico del paso actual. */
  currentSlug: string;
  className?: string;
  locale?: Locale;
}

export function StepNav({ currentSlug, className, locale = "es" }: StepNavProps) {
  const { prev, next } = getAdjacentSteps(currentSlug);
  const strings = t(locale);

  return (
    <nav
      aria-label={strings.stepNavAriaLabel}
      className={cn(
        "mt-20 grid gap-4 border-t border-[color:var(--course-border-strong)] pt-10 sm:grid-cols-2",
        className,
      )}
    >
      {prev ? (
        <Link
          href={getStepUrl(prev.slug, locale)}
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
            <span className="course-kicker">{strings.prev}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-course-mono text-xs font-semibold tabular-nums text-[color:var(--course-ink-mute)]">
              {String(prev.step).padStart(2, "0")}
            </span>
            <span className="font-course-display text-xl font-medium leading-tight tracking-tight text-[color:var(--course-ink)]">
              {getStepTitle(prev, locale)}
            </span>
          </div>
        </Link>
      ) : (
        <div aria-hidden />
      )}

      {next ? (
        <Link
          href={getStepUrl(next.slug, locale)}
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
            <span className="course-kicker">{strings.next}</span>
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
              {getStepTitle(next, locale)}
            </span>
          </div>
        </Link>
      ) : (
        <div aria-hidden />
      )}
    </nav>
  );
}
