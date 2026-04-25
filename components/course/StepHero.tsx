// ─── Rust Embedded desde Cero — Hero editorial de cada paso ───
//
// Editorial-tech redesign: kicker mono + step orbit + título serif grande +
// subtítulo de lectura + meta chips con link al repo y badge de CI.
//
// Uso desde MDX:
//   <StepHero
//     step={3}
//     total={9}
//     title="Paso 3 — LED PWM"
//     subtitle="Del LED binario al LED con intensidad modulable"
//     repoUrl="https://github.com/FMFigueroa/paso-03-led-pwm"
//   />

import { ArrowUpRight, Github } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface StepHeroProps {
  step: number;
  total?: number;
  title: string;
  subtitle?: string;
  repoUrl: string;
  className?: string;
}

// Extrae "owner/repo" desde "https://github.com/owner/repo".
// Usa URL() nativo para resiliencia (trailing slash, query string, www., etc.)
function extractRepoSlug(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean).slice(0, 2);
    if (segments.length !== 2) {
      throw new Error("Expected owner/repo in pathname");
    }
    return segments.join("/");
  } catch {
    return url.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  }
}

// Strippea "Paso N — " del título si viene prefixed — el número ya lo
// mostramos en el orbit. Preserva el resto del título crudo.
function stripStepPrefix(raw: string): string {
  return raw.replace(/^Paso\s+\d+\s+[—–-]\s+/i, "").trim();
}

export function StepHero({
  step,
  total = 9,
  title,
  subtitle,
  repoUrl,
  className,
}: StepHeroProps) {
  const repoSlug = extractRepoSlug(repoUrl);
  const badgeSrc = `https://github.com/${repoSlug}/actions/workflows/rust_ci.yml/badge.svg`;
  const actionsUrl = `${repoUrl}/actions/workflows/rust_ci.yml`;
  const displayTitle = stripStepPrefix(title);
  const stepPadded = String(step).padStart(2, "0");
  const totalPadded = String(total).padStart(2, "0");

  return (
    <header
      className={cn(
        "relative mb-16 pb-10",
        "border-b border-[color:var(--course-border-strong)]",
        className,
      )}
    >
      {/* Kicker + orbit con número del paso */}
      <div className="course-reveal course-reveal-1 mb-8 flex items-center gap-5">
        <div className="course-step-orbit">
          <span className="font-course-mono text-sm font-semibold text-[color:var(--course-accent)]">
            {stepPadded}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="course-kicker mb-1.5">
            Rust Embedded desde Cero
          </p>
          <p className="font-course-mono text-xs text-[color:var(--course-ink-soft)]">
            Paso <span className="text-[color:var(--course-ink)]">{stepPadded}</span>
            {" "}/ {totalPadded}
          </p>
        </div>
      </div>

      {/* Título — serif display prominente */}
      <h1
        className={cn(
          "course-reveal course-reveal-2",
          "font-course-display text-4xl font-medium leading-[1.05]",
          "tracking-tight text-[color:var(--course-ink)]",
          "sm:text-5xl md:text-6xl",
        )}
      >
        {displayTitle}
      </h1>

      {subtitle ? (
        <p
          className={cn(
            "course-reveal course-reveal-3",
            "mt-6 max-w-2xl text-lg leading-relaxed",
            "text-[color:var(--course-ink-soft)]",
            "sm:text-xl",
          )}
        >
          {subtitle}
        </p>
      ) : null}

      {/* Meta row: repo link + CI badge */}
      <div
        className={cn(
          "course-reveal course-reveal-4",
          "mt-10 flex flex-wrap items-center gap-x-6 gap-y-3",
        )}
      >
        <Link
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "no-course-style group inline-flex items-center gap-2",
            "font-course-mono text-xs",
            "text-[color:var(--course-ink-soft)]",
            "transition-colors hover:text-[color:var(--course-ink)]",
          )}
        >
          <Github className="size-3.5" aria-hidden />
          <span>{repoSlug}</span>
          <ArrowUpRight
            className="size-3.5 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
            aria-hidden
          />
        </Link>

        <span
          aria-hidden
          className="hidden h-3 w-px bg-[color:var(--course-border-strong)] sm:inline-block"
        />

        <a
          href={actionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver workflow de CI en GitHub"
          className="no-course-style inline-flex items-center opacity-80 transition-opacity hover:opacity-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badgeSrc}
            alt="CI status"
            className="h-[18px]"
            loading="lazy"
          />
        </a>
      </div>
    </header>
  );
}
