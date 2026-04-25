// ─── Rust Embedded from Zero — Metadata estática de los 9 pasos ───
//
// Fuente canónica del roadmap. Usado por CourseSidebar (nav lateral), StepNav
// (prev/next) y la landing del curso.
//
// Bilingüe: cada paso carga su título en ES y EN. Los slugs ES son la fuente
// de verdad — los EN se derivan vía `localizeStepSlug()` en routing.ts.
//
// En Fase 2.5 se puede reemplazar por un fetch al LMS API cuando los seeds
// estén en DB. Por ahora estático para no acoplar el desarrollo del frontend
// al estado del backend.

import type { Locale } from "./i18n";

export interface StepMeta {
  step: number;
  slug: string; // paso-0N-nombre (canónico, ES)
  title: string; // título corto ES (sin "Paso N —" prefix)
  titleEn: string; // título corto EN
  repoUrl: string;
}

/** Slug del curso ES — fuente de verdad. Pa' construir URLs por locale, usar `getCourseBaseUrl()` de routing.ts. */
export const COURSE_SLUG = "rust-embedded-desde-cero";

/** Nombre display del curso por locale. */
export const COURSE_TITLES: Record<Locale, string> = {
  es: "Rust Embedded desde Cero",
  en: "Rust Embedded from Zero",
};

/** @deprecated Usar `COURSE_TITLES[locale]`. Mantenido pa' compat con código existente que asume ES. */
export const COURSE_TITLE = COURSE_TITLES.es;

/** @deprecated Usar `getCourseBaseUrl(locale)` de routing.ts. */
export const COURSE_BASE_URL = `/courses/${COURSE_SLUG}`;

/** Los 9 pasos en orden canónico. NO reordenar — los consumidores asumen índice = step-1. */
export const COURSE_STEPS: StepMeta[] = [
  {
    step: 1,
    slug: "paso-01-scaffold",
    title: "Scaffold del proyecto",
    titleEn: "Project scaffold",
    repoUrl: "https://github.com/FMFigueroa/paso-01-scaffold",
  },
  {
    step: 2,
    slug: "paso-02-wifi-station",
    title: "WiFi Station + Provisioning",
    titleEn: "WiFi Station + Provisioning",
    repoUrl: "https://github.com/FMFigueroa/paso-02-wifi-station",
  },
  {
    step: 3,
    slug: "paso-03-led-pwm",
    title: "LED PWM",
    titleEn: "LED PWM",
    repoUrl: "https://github.com/FMFigueroa/paso-03-led-pwm",
  },
  {
    step: 4,
    slug: "paso-04-websocket-client",
    title: "WebSocket Client",
    titleEn: "WebSocket Client",
    repoUrl: "https://github.com/FMFigueroa/paso-04-websocket",
  },
  {
    step: 5,
    slug: "paso-05-light-state-management",
    title: "Light State Management",
    titleEn: "Light State Management",
    repoUrl: "https://github.com/FMFigueroa/paso-05-light-state",
  },
  {
    step: 6,
    slug: "paso-06-telemetry",
    title: "Telemetría",
    titleEn: "Telemetry",
    repoUrl: "https://github.com/FMFigueroa/paso-06-telemetry",
  },
  {
    step: 7,
    slug: "paso-07-time-sync-sntp",
    title: "Time Sync (SNTP)",
    titleEn: "Time Sync (SNTP)",
    repoUrl: "https://github.com/FMFigueroa/paso-07-time-sync",
  },
  {
    step: 8,
    slug: "paso-08-schedule-auto-mode",
    title: "Schedule & Auto Mode",
    titleEn: "Schedule & Auto Mode",
    repoUrl: "https://github.com/FMFigueroa/paso-08-schedule",
  },
  {
    step: 9,
    slug: "paso-09-concurrencia-watchdog",
    title: "Concurrencia & Watchdog",
    titleEn: "Concurrency & Watchdog",
    repoUrl: "https://github.com/FMFigueroa/paso-09-watchdog",
  },
];

/** Total inmutable (usado en "Paso N / 9"). */
export const COURSE_TOTAL_STEPS = COURSE_STEPS.length;

export function getStepBySlug(slug: string): StepMeta | undefined {
  return COURSE_STEPS.find((s) => s.slug === slug);
}

/** Título del paso en el locale dado. */
export function getStepTitle(step: StepMeta, locale: Locale): string {
  return locale === "en" ? step.titleEn : step.title;
}

/**
 * Dado un slug, devuelve los pasos adyacentes (prev/next). Si el slug no
 * existe, ambos son undefined. Si el slug es el primero, prev es undefined.
 * Si es el último, next es undefined.
 */
export function getAdjacentSteps(slug: string): {
  prev?: StepMeta;
  next?: StepMeta;
} {
  const index = COURSE_STEPS.findIndex((s) => s.slug === slug);
  if (index === -1) return {};
  return {
    prev: index > 0 ? COURSE_STEPS[index - 1] : undefined,
    next: index < COURSE_STEPS.length - 1 ? COURSE_STEPS[index + 1] : undefined,
  };
}
