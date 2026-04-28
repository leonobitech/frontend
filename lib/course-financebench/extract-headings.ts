// ─── Financial RAG Evaluation Suite — Extractor de headings para el TOC ───
//
// Mismo contrato que `lib/course/extract-headings.ts` — clonado tal cual para
// preservar aislamiento entre cursos. Parsea el source MDX antes de compilarlo
// y saca los headings H2/H3 en orden de aparición con sus IDs esperados (los
// mismos que inyecta `rehype-slug` en runtime). Los H1 no se incluyen — cada
// paso tiene un solo H1 en <StepHero> que no necesita estar en el TOC.

import { slugify } from "./slugify";

export interface Heading {
  /** ID del ancla (matchea `id` que inyecta rehype-slug). */
  id: string;
  /** Texto visible en el TOC (sin formato markdown). */
  text: string;
  /** Nivel: 2 = ##, 3 = ###. */
  depth: 2 | 3;
}

/**
 * Strip inline markdown (bold, italic, inline code, links) de un texto de heading
 * para mostrar en el TOC. Preserva el CONTENIDO del inline code intacto.
 */
function stripInlineMarkdown(text: string): string {
  // 1) Splittear preservando los inline code chunks (`...`).
  const parts = text.split(/(`[^`\n]+`)/g);
  const processed = parts.map((part, idx) => {
    if (idx % 2 === 1) {
      // Es inline code (índice impar tras split). Quitar los backticks pero
      // NO aplicar otras reglas.
      return part.slice(1, -1);
    }
    // Prosa fuera de inline code — aplicar bold/italic/links.
    return part
      .replace(/\*\*(.+?)\*\*/g, "$1") // **bold**
      .replace(/__(.+?)__/g, "$1") // __bold__
      .replace(/\*(.+?)\*/g, "$1") // *italic*
      // Italic con `_X_`: solo cuando los `_` NO están adentro de un identifier.
      .replace(/(?<![A-Za-z0-9_])_([^_\n]+?)_(?![A-Za-z0-9_])/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1"); // [text](url) → text
  });
  return processed.join("");
}

/**
 * Extrae H2 y H3 del source MDX preservando el orden del documento.
 */
export function extractHeadings(source: string): Heading[] {
  // Quitar fenced code blocks — tanto ```lang como ~~~lang.
  const stripped = source
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");

  const headings: Heading[] = [];
  // Trackeamos cuántas veces apareció cada slug para replicar la auto-dedupe
  // de `rehype-slug`: el primero queda `foo`, el segundo `foo-1`, etc.
  const slugCounts = new Map<string, number>();

  for (const rawLine of stripped.split("\n")) {
    const match = rawLine.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!match) continue;
    const depth = match[1].length as 2 | 3;
    const text = stripInlineMarkdown(match[2].trim());
    const baseSlug = slugify(text);
    if (!baseSlug) continue;
    const count = slugCounts.get(baseSlug) ?? 0;
    const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;
    slugCounts.set(baseSlug, count + 1);
    headings.push({ id, text, depth });
  }

  return headings;
}
