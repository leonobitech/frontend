// ─── Financial RAG Evaluation Suite — Slugify para anchors de headings ───
//
// Wrapper sobre `github-slugger` (la misma lib que usa `rehype-slug` por
// debajo). Mismo contrato que `lib/course/slugify.ts` — clonado tal cual para
// mantener aislamiento entre cursos. Garantiza que los IDs de los anchors
// generados desde el TOC extraído sean idénticos a los que rehype-slug inyecta
// en el HTML renderizado en runtime.

import GithubSlugger from "github-slugger";

const slugger = new GithubSlugger();

/**
 * Convierte un texto en un slug URL-safe idéntico al que `rehype-slug` inyecta.
 * Ejemplos:
 *   "¿Qué problema resuelve?"                  → "qué-problema-resuelve"
 *   "5. BGE-M3 baseline — Comparación"         → "5-bge-m3-baseline--comparación"
 *
 * Nota: la instancia es stateful por design (trackea slugs ya generados para
 * dedupe `-1`, `-2`), pero la reseteamos en cada call para slugs idempotentes
 * cuando se llama desde extract-headings (que maneja la dedupe externamente).
 */
export function slugify(text: string): string {
  slugger.reset();
  return slugger.slug(text);
}
