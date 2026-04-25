// ─── Rust Embedded desde Cero — Metadata estática de los 9 pasos ───
//
// Fuente canónica del roadmap. Usado por CourseSidebar (nav lateral), StepNav
// (prev/next) y la landing del curso.
//
// En Fase 2.5 se puede reemplazar por un fetch al LMS API (`/api/lms/courses/
// rust-embedded-desde-cero/lessons`) cuando los seeds estén en DB. Por ahora
// estático para no acoplar el desarrollo del frontend al estado del backend.

export interface StepMeta {
  step: number;
  slug: string; // paso-0N-nombre (canónico)
  title: string; // título corto para UI (sin "Paso N —" prefix)
  repoUrl: string;
}

/** Slug del curso en el LMS y en las URLs. */
export const COURSE_SLUG = "rust-embedded-desde-cero";

/** Nombre display del curso. */
export const COURSE_TITLE = "Rust Embedded desde Cero";

/**
 * Base URL del curso en el sitio. Usamos `/courses/:slug/...` en vez de
 * `/learn/:slug/...` porque el player del LMS existente no soporta MDX con
 * componentes React custom — tenemos un player específico bajo `/courses/`
 * que mantiene intacta la infra compartida del LMS.
 */
export const COURSE_BASE_URL = `/courses/${COURSE_SLUG}`;

/** Los 9 pasos en orden canónico. NO reordenar — los consumidores asumen índice = step-1. */
export const COURSE_STEPS: StepMeta[] = [
  {
    step: 1,
    slug: "paso-01-scaffold",
    title: "Scaffold del proyecto",
    repoUrl: "https://github.com/FMFigueroa/paso-01-scaffold",
  },
  {
    step: 2,
    slug: "paso-02-wifi-station",
    title: "WiFi Station + Provisioning",
    repoUrl: "https://github.com/FMFigueroa/paso-02-wifi-station",
  },
  {
    step: 3,
    slug: "paso-03-led-pwm",
    title: "LED PWM",
    repoUrl: "https://github.com/FMFigueroa/paso-03-led-pwm",
  },
  {
    step: 4,
    slug: "paso-04-websocket-client",
    title: "WebSocket Client",
    repoUrl: "https://github.com/FMFigueroa/paso-04-websocket",
  },
  {
    step: 5,
    slug: "paso-05-light-state-management",
    title: "Light State Management",
    repoUrl: "https://github.com/FMFigueroa/paso-05-light-state",
  },
  {
    step: 6,
    slug: "paso-06-telemetry",
    title: "Telemetría",
    repoUrl: "https://github.com/FMFigueroa/paso-06-telemetry",
  },
  {
    step: 7,
    slug: "paso-07-time-sync-sntp",
    title: "Time Sync (SNTP)",
    repoUrl: "https://github.com/FMFigueroa/paso-07-time-sync",
  },
  {
    step: 8,
    slug: "paso-08-schedule-auto-mode",
    title: "Schedule & Auto Mode",
    repoUrl: "https://github.com/FMFigueroa/paso-08-schedule",
  },
  {
    step: 9,
    slug: "paso-09-concurrencia-watchdog",
    title: "Concurrencia & Watchdog",
    repoUrl: "https://github.com/FMFigueroa/paso-09-watchdog",
  },
];

/** Total inmutable (usado en "Paso N / 9"). */
export const COURSE_TOTAL_STEPS = COURSE_STEPS.length;

export function getStepBySlug(slug: string): StepMeta | undefined {
  return COURSE_STEPS.find((s) => s.slug === slug);
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
