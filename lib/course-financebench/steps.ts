// ─── Financial RAG Evaluation Suite — Metadata estática de las lessons ───
//
// Fuente canónica del roadmap. Usado por CourseSidebar (nav lateral), StepNav
// (prev/next) y la landing del curso.
//
// Bilingüe: cada paso carga su título en ES y EN. Los slugs ES son la fuente
// de verdad — los EN se derivan vía `localizeStepSlug()` en routing.ts.
//
// El roadmap tiene ~19 lessons agrupadas en 5 Stages (0..4). El campo
// `stage` permite a la landing agrupar visualmente las lessons. Los títulos
// arrancan como placeholders ("TBD") hasta que cada memoria descriptiva
// pulida en Notion se cierre y dispare el Trigger A correspondiente.
//
// El `repoUrl` apunta SIEMPRE al mismo repo monolítico — la individualización
// por lesson vive en el frontmatter (`anchor_commit`, `anchor_tag`).

import type { Locale } from "./i18n";

export interface StepMeta {
  step: number;
  slug: string; // paso-NN-nombre (canónico, ES)
  title: string; // título corto ES (sin "Paso N —" prefix)
  titleEn: string; // título corto EN
  /** Repo monolítico (mismo URL en todas las lessons). */
  repoUrl: string;
  /** Stage 0..4 — agrupación visual en la landing. */
  stage: 0 | 1 | 2 | 3 | 4;
}

/** Slug del curso ES — fuente de verdad. Mismo slug en es y en (no se localiza). */
export const COURSE_SLUG = "financial-rag-eval-from-zero";

/** Nombre display del curso por locale. */
export const COURSE_TITLES: Record<Locale, string> = {
  es: "Financial RAG Evaluation Suite",
  en: "Financial RAG Evaluation Suite",
};

/** @deprecated Usar `COURSE_TITLES[locale]`. Mantenido pa' compat con código existente. */
export const COURSE_TITLE = COURSE_TITLES.es;

/** @deprecated Usar `getCourseBaseUrl(locale)` de routing.ts. */
export const COURSE_BASE_URL = `/courses/${COURSE_SLUG}`;

/** Repo monolítico de financebench-rag-eval — SoT de código. */
export const COURSE_REPO_URL = "https://github.com/FMFigueroa/financebench-rag-eval";

/**
 * Lessons en orden canónico. La lista es **propuesta inicial** — el número
 * exacto de lessons por Stage se determina por la cantidad de memorias
 * descriptivas pulidas en Notion. Si un bloque crece y se subdivide, se
 * agregan lessons. Si dos bloques se fusionan, se compactan.
 *
 * NO reordenar — los consumidores asumen índice = step-1.
 */
export const COURSE_STEPS: StepMeta[] = [
  // ─── Stage 0 — Foundation (v0.1.0) ───
  {
    step: 1,
    slug: "paso-01-foundation-setup",
    title: "Foundation Setup",
    titleEn: "Foundation Setup",
    repoUrl: COURSE_REPO_URL,
    stage: 0,
  },
  // ─── Stage 1 — Baselines (v0.2.0) ───
  {
    step: 2,
    slug: "paso-02-pytorch-fundamentals",
    title: "PyTorch Fundamentals",
    titleEn: "PyTorch Fundamentals",
    repoUrl: COURSE_REPO_URL,
    stage: 1,
  },
  {
    step: 3,
    slug: "paso-03-financebench-loader",
    title: "FinanceBench Loader",
    titleEn: "FinanceBench Loader",
    repoUrl: COURSE_REPO_URL,
    stage: 1,
  },
  {
    step: 4,
    slug: "paso-04-eval-pipeline",
    title: "Eval Pipeline",
    titleEn: "Eval Pipeline",
    repoUrl: COURSE_REPO_URL,
    stage: 1,
  },
  {
    step: 5,
    slug: "paso-05-openai-baseline",
    title: "OpenAI Baseline",
    titleEn: "OpenAI Baseline",
    repoUrl: COURSE_REPO_URL,
    stage: 1,
  },
  {
    step: 6,
    slug: "paso-06-bge-m3-baseline",
    title: "BGE-M3 Baseline",
    titleEn: "BGE-M3 Baseline",
    repoUrl: COURSE_REPO_URL,
    stage: 1,
  },
  // ─── Stage 2 — Comparative (v0.3.0) ───
  {
    step: 7,
    slug: "paso-07-voyage-embedders",
    title: "Voyage Embedders",
    titleEn: "Voyage Embedders",
    repoUrl: COURSE_REPO_URL,
    stage: 2,
  },
  {
    step: 8,
    slug: "paso-08-jina-qwen3",
    title: "Jina / Qwen3 Embedders",
    titleEn: "Jina / Qwen3 Embedders",
    repoUrl: COURSE_REPO_URL,
    stage: 2,
  },
  {
    step: 9,
    slug: "paso-09-contextual-retrieval",
    title: "Contextual Retrieval",
    titleEn: "Contextual Retrieval",
    repoUrl: COURSE_REPO_URL,
    stage: 2,
  },
  {
    step: 10,
    slug: "paso-10-late-chunking",
    title: "Late Chunking",
    titleEn: "Late Chunking",
    repoUrl: COURSE_REPO_URL,
    stage: 2,
  },
  {
    step: 11,
    slug: "paso-11-reranking-hybrid",
    title: "Reranking & Hybrid Search",
    titleEn: "Reranking & Hybrid Search",
    repoUrl: COURSE_REPO_URL,
    stage: 2,
  },
  {
    step: 12,
    slug: "paso-12-tabla-maestra-parcial",
    title: "Tabla Maestra Parcial",
    titleEn: "Master Table — Partial",
    repoUrl: COURSE_REPO_URL,
    stage: 2,
  },
  // ─── Stage 3 — Custom (v0.4.0) ───
  {
    step: 13,
    slug: "paso-13-fine-tuning-design",
    title: "Fine-Tuning Design",
    titleEn: "Fine-Tuning Design",
    repoUrl: COURSE_REPO_URL,
    stage: 3,
  },
  {
    step: 14,
    slug: "paso-14-fine-tuning-bge-m3",
    title: "Fine-Tuning BGE-M3",
    titleEn: "Fine-Tuning BGE-M3",
    repoUrl: COURSE_REPO_URL,
    stage: 3,
  },
  {
    step: 15,
    slug: "paso-15-fine-tuned-eval",
    title: "Fine-Tuned Evaluation",
    titleEn: "Fine-Tuned Evaluation",
    repoUrl: COURSE_REPO_URL,
    stage: 3,
  },
  {
    step: 16,
    slug: "paso-16-query-pipeline",
    title: "Query Pipeline",
    titleEn: "Query Pipeline",
    repoUrl: COURSE_REPO_URL,
    stage: 3,
  },
  {
    step: 17,
    slug: "paso-17-failure-modes",
    title: "Failure Mode Analysis",
    titleEn: "Failure Mode Analysis",
    repoUrl: COURSE_REPO_URL,
    stage: 3,
  },
  // ─── Stage 4 — Publication (v1.0.0) ───
  {
    step: 18,
    slug: "paso-18-paper-readme",
    title: "Paper-Quality README",
    titleEn: "Paper-Quality README",
    repoUrl: COURSE_REPO_URL,
    stage: 4,
  },
  {
    step: 19,
    slug: "paso-19-publication",
    title: "Publication & HF Hub",
    titleEn: "Publication & HF Hub",
    repoUrl: COURSE_REPO_URL,
    stage: 4,
  },
];

/** Total inmutable (usado en "Paso N / total"). */
export const COURSE_TOTAL_STEPS = COURSE_STEPS.length;

/** Stages 0..4 — orden visual en la landing. */
export const COURSE_STAGES: Array<{
  stage: 0 | 1 | 2 | 3 | 4;
  /** Tag de release que cierra el Stage. */
  releaseTag: string;
  titleEs: string;
  titleEn: string;
}> = [
  { stage: 0, releaseTag: "v0.1.0", titleEs: "Foundation", titleEn: "Foundation" },
  { stage: 1, releaseTag: "v0.2.0", titleEs: "Baselines", titleEn: "Baselines" },
  { stage: 2, releaseTag: "v0.3.0", titleEs: "Comparative", titleEn: "Comparative" },
  { stage: 3, releaseTag: "v0.4.0", titleEs: "Custom", titleEn: "Custom" },
  { stage: 4, releaseTag: "v1.0.0", titleEs: "Publication", titleEn: "Publication" },
];

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

/** Lessons agrupadas por Stage — útil para la landing. */
export function getStepsByStage(stage: 0 | 1 | 2 | 3 | 4): StepMeta[] {
  return COURSE_STEPS.filter((s) => s.stage === stage);
}
