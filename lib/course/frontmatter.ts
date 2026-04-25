// ─── Rust Embedded desde Cero — Schema del frontmatter por paso ───
//
// Valida el objeto "meta" que cada archivo .mdx del curso exporta via frontmatter.
// Usado por el pipeline MDX (CourseContent) y por el script sync-notion-rust.ts
// al generar los archivos desde las páginas Notion.
//
// El schema refleja el contrato definido en CLAUDE.md del proyecto "Rust Embedded
// desde Cero — Course Automation" (Fase 1 del módulo de integración frontend).

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
// "simple"  → paso-01 style (un solo archivo src + configs)
// "complex" → paso-02+ style (múltiples módulos)
export const courseFlavorSchema = z.enum(["simple", "complex"]);

// ─── Frontmatter completo ───

export const courseFrontmatterSchema = z.object({
  step: z.number().int().min(1).max(9),
  slug: z.string().regex(/^paso-\d{2}-[a-z0-9-]+$/),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  summary: z.string().min(1),
  concept_rust: z.string().min(1),
  concept_embedded: z.string().min(1),
  repo_url: z.string().url(),
  notion_source_id: z.string().min(1).optional(),
  reading_minutes: z.number().int().positive(),
  flavor: courseFlavorSchema,
  bonus_question: courseBonusQuestionSchema,
  tags: z.array(z.string().min(1)).min(1),
  published_at: z.string().optional(),
});

export type CourseFrontmatter = z.infer<typeof courseFrontmatterSchema>;
export type CourseBonusQuestion = z.infer<typeof courseBonusQuestionSchema>;
export type CourseFlavor = z.infer<typeof courseFlavorSchema>;

/**
 * Parse + validate course frontmatter.
 * Lanza ZodError si el objeto no matchea el schema — detecta typos o campos
 * faltantes temprano (en build, no en runtime).
 */
export function parseCourseFrontmatter(raw: unknown): CourseFrontmatter {
  return courseFrontmatterSchema.parse(raw);
}

/**
 * Versión safe: retorna result en vez de tirar.
 * Útil en el sync script para reportar errores por archivo sin abortar la corrida entera.
 */
export function safeParseCourseFrontmatter(raw: unknown) {
  return courseFrontmatterSchema.safeParse(raw);
}
