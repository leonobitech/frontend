// ─── Quitar numeración manual de los H3 ───
//
// El counter CSS de los headings ahora genera marcadores `a.-`, `b.-`, `c.-`
// automáticamente, reseteándose en cada H2. Los H3 que vienen del MDX con
// numeración manual estilo `### 1. Rust (nightly)` quedan doble-numerados
// (`a.- 1. Rust (nightly)`). Este módulo limpia el `1.`, `2.`, etc. del
// texto del H3 para que solo quede la letra del counter.
//
// Excepciones: los H3 que empiezan con `Pregunta N:` se preservan tal cual
// porque la numeración es semánticamente parte del título de la pregunta.
//
// Idempotente. Respeta code blocks (no toca `# comentario` adentro).

const CODE_FENCE_RE = /(```[\s\S]*?```)/g;

function stripFromProse(text: string): string {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^### (\d+)\.\s+(.+)$/);
    if (!match) continue;
    const restOfTitle = match[2];
    // Preservar `Pregunta N:` y casos similares donde la numeración es parte
    // del título — solo quitamos cuando el resto NO arranca con "Pregunta".
    if (/^Pregunta\b/i.test(restOfTitle)) continue;
    lines[i] = `### ${restOfTitle}`;
  }
  return lines.join("\n");
}

/**
 * Quita los números manuales de los H3 (preserva `### Pregunta N:`).
 */
export function stripH3ManualNumbers(text: string): string {
  const fmMatch = text.match(/^(---\n[\s\S]*?\n---\n)/);
  const frontmatter = fmMatch ? fmMatch[0] : "";
  const body = fmMatch ? text.slice(frontmatter.length) : text;

  const chunks = body.split(CODE_FENCE_RE);
  const cleaned = chunks
    .map((chunk) => (chunk.startsWith("```") ? chunk : stripFromProse(chunk)))
    .join("");

  return frontmatter + cleaned;
}
