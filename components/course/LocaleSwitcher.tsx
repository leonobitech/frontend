// ─── Rust Embedded from Zero — Locale switcher ES ↔ EN ───
//
// Server component (sin hooks). Recibe el locale actual + el slug ES del
// paso (si está en uno) y construye la URL del otro locale preservando
// el contexto. Si no hay step (estás en la landing), apunta a la landing
// del otro locale.
//
// Visualmente: pill chip mono "EN" / "ES" con flecha lateral. Coherente con
// el resto del UI editorial del curso.

import { ArrowRightLeft } from "lucide-react";
import Link from "next/link";

import { t, type Locale } from "@/lib/course/i18n";
import { getCourseBaseUrl, localizeStepSlug } from "@/lib/course/routing";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  /** Locale actualmente visible en la página. */
  currentLocale: Locale;
  /** Slug ES canónico del paso actual (si estamos en un step page). */
  currentStepSlug?: string;
  className?: string;
}

export function LocaleSwitcher({
  currentLocale,
  currentStepSlug,
  className,
}: LocaleSwitcherProps) {
  const otherLocale: Locale = currentLocale === "es" ? "en" : "es";
  const strings = t(currentLocale);

  const href = currentStepSlug
    ? `${getCourseBaseUrl(otherLocale)}/${localizeStepSlug(currentStepSlug, otherLocale)}`
    : getCourseBaseUrl(otherLocale);

  return (
    <Link
      href={href}
      hrefLang={otherLocale}
      aria-label={strings.switchToOtherLocale}
      title={strings.switchToOtherLocale}
      className={cn(
        "no-course-style group inline-flex items-center gap-2 rounded-full",
        "border border-[color:var(--course-border-strong)]",
        "bg-[color:var(--course-surface)]/70 backdrop-blur-sm",
        "px-3 py-1.5 font-course-mono text-[11px] font-semibold uppercase tracking-wider",
        "text-[color:var(--course-ink-soft)]",
        "transition-colors duration-200",
        "hover:border-[color:var(--course-accent)]/50",
        "hover:text-[color:var(--course-accent)]",
        className,
      )}
    >
      <span aria-hidden className="text-[color:var(--course-ink-mute)]">
        {strings.thisLocaleLabel}
      </span>
      <ArrowRightLeft
        className="size-3 text-[color:var(--course-ink-mute)] transition-colors group-hover:text-[color:var(--course-accent)]"
        aria-hidden
        strokeWidth={2.5}
      />
      <span>{strings.otherLocaleLabel}</span>
    </Link>
  );
}
