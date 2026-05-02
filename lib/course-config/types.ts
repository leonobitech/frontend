// ─── Course Config — contrato compartido entre los components shared y cada curso ───
//
// Los components en `@/components/course/` reciben este config (por prop a los
// top-level, y vía context a los hijos) en vez de importar estáticamente de
// `@/lib/course/`. Esto permite que el mismo set de components sirva al curso
// de Rust Embedded y al de Financial RAG Eval (financebench), sin clonar.
//
// Los campos rust-only o stage-aware viven en cada `lib/course*/` específico —
// el config sirve solo el subset que los components shared necesitan.

import type { Locale, CourseStrings } from "@/lib/course/i18n";

export type { Locale, CourseStrings };

/** Subset del frontmatter de cada lesson que los components shared consumen.
 *  Los frontmatters específicos de cada curso (rust, financebench) extienden
 *  con campos extra (ej. `anchor_commit`, `concept_python` en financebench),
 *  pero el contrato shared sólo expone los campos universales. */
export interface BaseFrontmatter {
  step: number;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  repo_url: string;
  reading_minutes: number;
  tags: string[];
  published_at?: string;
}

/** Subset de StepMeta que los components shared consumen. Cada curso puede
 *  extender su propio `StepMeta` con campos extra (ej. `stage` en financebench),
 *  pero el contrato compartido solo expone lo común. */
export interface BaseStepMeta {
  step: number;
  /** Slug ES canónico — fuente de verdad. */
  slug: string;
  /** Título corto ES (sin "Paso N —" prefix). */
  title: string;
  /** Título corto EN. */
  titleEn: string;
  /** URL del repo con código de la lesson (puede ser monolítico o por-step). */
  repoUrl: string;
}

export interface AdjacentSteps<T extends BaseStepMeta = BaseStepMeta> {
  prev?: T;
  next?: T;
}

/** Contrato que cada curso debe implementar. */
export interface CourseConfig {
  // ─── Identidad ───
  /** Slug canónico ES (ej. "rust-embedded-desde-cero"). Usado en endpoints LMS. */
  courseSlug: string;
  /** Title display por locale. */
  courseTitles: Record<Locale, string>;

  // ─── Steps ───
  steps: readonly BaseStepMeta[];
  totalSteps: number;

  // ─── i18n ───
  t: (locale: Locale) => CourseStrings;

  // ─── Routing helpers (bound al curso) ───
  getCourseBaseUrl: (locale: Locale) => string;
  getStepUrl: (esSlug: string, locale: Locale) => string;
  localizeStepSlug: (esSlug: string, locale: Locale) => string;

  // ─── Steps helpers (bound al curso) ───
  getStepBySlug: (slug: string) => BaseStepMeta | undefined;
  getStepTitle: (step: BaseStepMeta, locale: Locale) => string;
  getAdjacentSteps: (slug: string) => AdjacentSteps;

  // ─── LMS API ───
  /** Path base de los endpoints LMS (ej. "/api/learn/courses"). */
  lmsApiBase: string;

  // ─── UI / SEO ───
  /** OG image path absoluto-relativo (ej. "/opengraph-course-rust-embedded.png"). */
  ogImagePath: string;
  /** Modifier CSS class aplicada junto a `.course-root` para sobreescribir la
   *  paleta default (rust-orange / warm brown). Si se omite, el curso hereda
   *  la paleta default. Ej: financebench setea `"course-financebench"` para
   *  cambiar a teal/navy. Solo el className — los tokens viven en globals.css. */
  themeClassName?: string;
}
