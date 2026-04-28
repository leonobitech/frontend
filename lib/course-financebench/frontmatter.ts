// ─── Financial RAG Evaluation Suite — Schema del frontmatter por lesson ───
//
// Valida el objeto "meta" que cada archivo .mdx del curso exporta via
// frontmatter. Usado por el pipeline MDX (CourseContent) y por el script
// `sync-notion-financebench.ts` al generar los archivos desde Notion.
//
// Diferencias respecto a `lib/course/frontmatter.ts` (rust-embedded):
//   - `step` sin `.max(9)` — el curso tiene ~19 lessons, abierto.
//   - `concept_python` + `concept_rag` reemplazan `concept_rust` + `concept_embedded`.
//   - Anchor pattern: `anchor_commit`, `anchor_tag`, `pr_number`, `branch_checkpoint`,
//     `stage`, `notion_memory_url`. Cada lesson apunta a un punto inmutable del
//     repo financebench-rag-eval (un solo repo monolítico, no 1 repo por paso).

import { z } from "zod";

// ─── Bonus question (pool del assessment final) ───

export const courseBonusQuestionSchema = z.object({
  prompt: z.string().min(1),
  correct: z.string().min(1),
  // Exactamente 3 distractors para armar 4 opciones (correct + 3 wrong)
  distractors: z.array(z.string().min(1)).length(3),
  explanation: z.string().min(1),
});

// ─── Flavor de la página Notion original ───
export const courseFlavorSchema = z.enum(["simple", "complex"]);

// ─── Frontmatter completo ───

export const financebenchFrontmatterSchema = z.object({
  step: z.number().int().min(1),
  slug: z.string().regex(/^paso-\d{2}-[a-z0-9-]+$/),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  summary: z.string().min(1),

  // Conceptos pedagógicos del par (estilo rust "concept_rust + concept_embedded")
  concept_python: z.string().min(1),
  concept_rag: z.string().min(1),

  // Repo monolítico — el mismo URL en todas las lessons. La individualización
  // viene del anchor_commit y anchor_tag.
  repo_url: z.string().url(),

  // Anchors al commit/tag/PR del repo financebench-rag-eval. SHA del squash-merge
  // anterior al anchor_tag (Stage closing tag).
  anchor_commit: z.string().regex(/^[a-f0-9]{7,40}$/, "anchor_commit debe ser un SHA git de 7-40 hex"),
  anchor_tag: z.string().regex(/^v\d+\.\d+\.\d+$/, "anchor_tag debe ser un release tag semver vMAJOR.MINOR.PATCH"),
  pr_number: z.number().int().positive(),
  // Branch git "course/stage-N/lesson-M-slug" pusheada y nunca mergeada en el
  // repo financebench-rag-eval. Opcional — solo si agrega valor sobre el tag.
  branch_checkpoint: z.string().min(1).optional(),

  // Stage 0..4 — agrupación visual en la landing.
  stage: z.number().int().min(0).max(4),

  // Anchors a Notion (memoria descriptiva pulida, source of truth de hechos).
  notion_memory_url: z.string().url(),
  // UUID de la página Notion (con o sin guiones, para compat con el sync script).
  notion_source_id: z.string().min(1).optional(),

  reading_minutes: z.number().int().positive(),
  flavor: courseFlavorSchema,
  bonus_question: courseBonusQuestionSchema,
  tags: z.array(z.string().min(1)).min(1),
  published_at: z.string().optional(),
});

export type FinancebenchFrontmatter = z.infer<typeof financebenchFrontmatterSchema>;
export type CourseBonusQuestion = z.infer<typeof courseBonusQuestionSchema>;
export type CourseFlavor = z.infer<typeof courseFlavorSchema>;

/** Alias para mantener nombres simétricos con `lib/course/frontmatter.ts`. */
export type CourseFrontmatter = FinancebenchFrontmatter;

/**
 * Parse + validate course frontmatter.
 * Lanza ZodError si el objeto no matchea el schema — detecta typos o campos
 * faltantes temprano (en build, no en runtime).
 */
export function parseCourseFrontmatter(raw: unknown): FinancebenchFrontmatter {
  return financebenchFrontmatterSchema.parse(raw);
}

/**
 * Versión safe: retorna result en vez de tirar.
 * Útil en el sync script para reportar errores por archivo sin abortar la corrida entera.
 */
export function safeParseCourseFrontmatter(raw: unknown) {
  return financebenchFrontmatterSchema.safeParse(raw);
}
