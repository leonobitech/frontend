// ─── Rust Embedded from Zero — Routing helpers por locale ───
//
// El curso vive en dos rutas paralelas:
//   ES — /courses/rust-embedded-desde-cero/{paso-NN-...}
//   EN — /en/courses/rust-embedded-from-zero/{step-NN-...}
//
// Mapear ES↔EN ahora es trivial (solo "paso" → "step"), pero centralizamos
// acá para que cuando un slug requiera traducción real (ej. "concurrencia" →
// "concurrency") solo se toque un sitio.

import { COURSE_STEPS } from "./steps";
import type { Locale } from "./i18n";

// ─── Slug del curso (carpeta de URL) ───

const COURSE_SLUG_BY_LOCALE: Record<Locale, string> = {
  es: "rust-embedded-desde-cero",
  en: "rust-embedded-from-zero",
};

export function getCourseSlug(locale: Locale): string {
  return COURSE_SLUG_BY_LOCALE[locale];
}

/** Base URL absoluta-relativa del curso por locale. */
export function getCourseBaseUrl(locale: Locale): string {
  return locale === "es"
    ? `/courses/${COURSE_SLUG_BY_LOCALE.es}`
    : `/en/courses/${COURSE_SLUG_BY_LOCALE.en}`;
}

// ─── Slugs de pasos: "paso-01-scaffold" ↔ "step-01-scaffold" ───
//
// Hoy todos los slugs siguen el patrón "<prefix>-NN-<rest>" donde solo cambia
// el prefijo. Si en algún momento querés traducir el `<rest>`, agregás un
// override en STEP_SLUG_OVERRIDES_EN.

const STEP_PREFIX_BY_LOCALE: Record<Locale, string> = {
  es: "paso",
  en: "step",
};

/** Overrides explícitos pa' EN cuando el slug ES no se puede derivar 1:1. */
const STEP_SLUG_OVERRIDES_EN: Record<string, string> = {
  // Ejemplo futuro: "paso-09-concurrencia-watchdog": "step-09-concurrency-watchdog"
};

/** Convierte un slug ES (canónico, fuente de verdad) al slug del locale dado. */
export function localizeStepSlug(esSlug: string, locale: Locale): string {
  if (locale === "es") return esSlug;
  if (STEP_SLUG_OVERRIDES_EN[esSlug]) return STEP_SLUG_OVERRIDES_EN[esSlug];
  return esSlug.replace(/^paso-/, `${STEP_PREFIX_BY_LOCALE.en}-`);
}

/** Convierte un slug del locale dado de vuelta al slug ES canónico. */
export function canonicalizeStepSlug(
  localizedSlug: string,
  locale: Locale,
): string | null {
  if (locale === "es") {
    return COURSE_STEPS.some((s) => s.slug === localizedSlug)
      ? localizedSlug
      : null;
  }
  // EN → ES: invertir overrides primero, después el prefijo
  const reverseOverride = Object.entries(STEP_SLUG_OVERRIDES_EN).find(
    ([, v]) => v === localizedSlug,
  );
  if (reverseOverride) return reverseOverride[0];
  if (!localizedSlug.startsWith(`${STEP_PREFIX_BY_LOCALE.en}-`)) return null;
  const candidate = localizedSlug.replace(/^step-/, "paso-");
  return COURSE_STEPS.some((s) => s.slug === candidate) ? candidate : null;
}

/** URL completa del paso por locale (relativa al origin). */
export function getStepUrl(esSlug: string, locale: Locale): string {
  return `${getCourseBaseUrl(locale)}/${localizeStepSlug(esSlug, locale)}`;
}

/** Lista todos los slugs localizados — usado en `generateStaticParams`. */
export function listLocalizedStepSlugs(locale: Locale): string[] {
  return COURSE_STEPS.map((s) => localizeStepSlug(s.slug, locale));
}
