// ─── Rust Embedded from Zero — Locale switcher ES ↔ EN ───
//
// Server component (sin hooks). Recibe el locale actual y el `targetHref`
// del otro locale ya resuelto por el caller. El caller es quien sabe si el
// step EN equivalente existe; si no, pasa el landing del otro locale como
// target.

import { ArrowRightLeft } from "lucide-react";
import Link from "next/link";

import type { CourseConfig, Locale } from "@/lib/course-config/types";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  /** Config del curso — provee `t()` para los labels del switcher. */
  course: CourseConfig;
  /** Locale actualmente visible en la página. */
  currentLocale: Locale;
  /** URL absoluta-relativa al otro locale, ya resuelta por el caller. */
  targetHref: string;
  className?: string;
}

export function LocaleSwitcher({
  course,
  currentLocale,
  targetHref,
  className,
}: LocaleSwitcherProps) {
  const otherLocale: Locale = currentLocale === "es" ? "en" : "es";
  const strings = course.t(currentLocale);

  return (
    <Link
      href={targetHref}
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
