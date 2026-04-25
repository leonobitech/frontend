// ─── Quitar emojis decorativos del MDX ───
//
// Prohibido por el manual editorial (§4): los emojis en headings, bullets,
// callouts y prosa narrativa son ruido visual en docs técnicas. Solo se
// preservan los emojis DENTRO de code blocks (donde puede ser parte del
// código real).
//
// Idempotente. Respeta code blocks (```...```) e inline code (`...`).

const CODE_FENCE_RE = /(```[\s\S]*?```)/g;
const INLINE_CODE_RE = /(`[^`\n]+`)/g;

// Regex Unicode para emojis (ranges principales). Puede no atrapar 100% de los
// nuevos emojis pero cubre los que Notion exporta (>99% del catálogo común).
const EMOJI_RE =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1FA00}-\u{1FAFF}\u{200D}\u{FE0F}]/gu;

/**
 * Quita emojis de un fragmento de prosa.
 * Diseño conservador: solo toca emojis y los espacios contiguos al emoji,
 * sin reformatear indentación general (que rompería listas dentro de callouts).
 */
function stripFromProse(text: string): string {
  // 1) Emoji + UN espacio siguiente → "" (cubre `## 🛠️ Title` → `## Title`).
  //    NO consumimos espacio anterior — se preserva la indentación y la
  //    separación post-`##`/`###`.
  let result = text.replace(
    new RegExp(EMOJI_RE.source + "[ \\t]?", "gu"),
    "",
  );
  // 2) Limpiar emojis residuales sin espacio adyacente
  result = result.replace(EMOJI_RE, "");
  // 3) Eliminar espacios sobrantes antes de puntuación: `texto ,` → `texto,`.
  //    Ocurre cuando el emoji estaba pegado a la puntuación (ej: `checks ✓,`).
  result = result.replace(/[ \t]+([.,;:!?)\]])/g, "$1");
  // 4) Normalizar dobles espacios dentro de la misma línea
  result = result.replace(/(\S)[ \t]{2,}(\S)/g, "$1 $2");
  return result;
}

/**
 * Procesa un chunk que NO está dentro de un code fence. Excluye los inline
 * code (`...`) que puedan contener emojis legítimos (raro pero posible).
 */
function processNonCodeChunk(text: string): string {
  const chunks = text.split(INLINE_CODE_RE);
  return chunks
    .map((chunk) => (chunk.startsWith("`") ? chunk : stripFromProse(chunk)))
    .join("");
}

/**
 * Quita emojis decorativos del MDX. Preserva emojis dentro de code blocks
 * (incluido inline code) por si forman parte del código real.
 */
export function stripDecorativeEmojis(text: string): string {
  // Separar frontmatter para procesarlo también (Notion mete emojis ahí)
  const fmMatch = text.match(/^(---\n[\s\S]*?\n---\n)/);
  const frontmatter = fmMatch ? fmMatch[0] : "";
  const body = fmMatch ? text.slice(frontmatter.length) : text;

  // Frontmatter: aplicamos strip a todo el bloque (es YAML, no tiene code blocks
  // anidados típicamente)
  const cleanedFrontmatter = frontmatter.replace(EMOJI_RE, "");

  const chunks = body.split(CODE_FENCE_RE);
  const cleanedBody = chunks
    .map((chunk) => (chunk.startsWith("```") ? chunk : processNonCodeChunk(chunk)))
    .join("");

  return cleanedFrontmatter + cleanedBody;
}
