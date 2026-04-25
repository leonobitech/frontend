// ─── Sanitizador de MDX generado desde Notion ───
//
// Notion exporta texto plano con patrones que rompen el parser de MDX:
//   - `Arc<Mutex<T>>`, `Option<Instant>` en prosa → MDX los parsea como JSX tags
//   - `<20 líneas` en prosa → MDX ve `<20` y parsea tag que empieza con número
//
// Este módulo envuelve esos patrones en backticks para que MDX los trate como
// inline code en lugar de JSX. Respeta:
//   - code blocks (```...```)
//   - inline code (`...`)
//   - frontmatter YAML (entre los `---` iniciales)
//   - componentes JSX legítimos del curso (Callout, QuizItem, StepHero, Reflexion)
//
// Idempotente: aplicarlo N veces produce el mismo resultado que aplicarlo 1 vez.

const VALID_JSX_COMPONENTS = new Set([
  "Callout",
  "QuizItem",
  "StepHero",
  "Reflexion",
]);

const CODE_FENCE_RE = /(```[\s\S]*?```)/g;
const INLINE_CODE_RE = /(`[^`\n]+`)/g;

// Matching de tipos genéricos Rust con hasta 3 niveles de nesting:
//   Option<T>                         (1 nivel)
//   Arc<Mutex<T>>                     (2 niveles)
//   Arc<Mutex<Option<Instant>>>       (3 niveles)
//
// La regex captura el identificador capitalized completo + sus angle brackets.
// Requisito: identificador pegado al `<` (sin espacios entre ambos), para
// evitar falsos positivos con expresiones matemáticas como `X < 5`.
const GENERIC_TYPE_RE =
  /\b([A-Z][A-Za-z0-9_]*<(?:[^<>\n]|<(?:[^<>\n]|<[^<>\n]*>)*>)*>)/g;

/**
 * Envuelve en backticks patrones problemáticos para MDX dentro de un chunk de
 * prosa (ya sin code blocks ni inline code).
 */
function wrapDangerousPatterns(text: string): string {
  let result = text;

  // 1. Generics Rust (`Option<Instant>`, `Arc<Mutex<T>>`, etc.) — envolver
  //    en backticks si el identificador NO es un componente JSX válido.
  result = result.replace(GENERIC_TYPE_RE, (match, captured: string) => {
    // El nombre del tipo es todo hasta el primer `<`.
    const ltIdx = captured.indexOf("<");
    const name = captured.slice(0, ltIdx);
    if (VALID_JSX_COMPONENTS.has(name)) return match;
    return `\`${captured}\``;
  });

  // 2. `<N` seguido de número (ej: "<20 líneas", "<100ms"). MDX lo interpreta
  //    como tag que empieza con dígito. Reemplazamos por "menos de N" (más
  //    legible que backticks en contexto narrativo).
  result = result.replace(
    /(?<![A-Za-z0-9_`])<(\d+)(\s|,|\.|;|\))/g,
    "menos de $1$2",
  );

  // 3. Comparaciones `<=` y `>=` en prosa. MDX ve `<=` como tag que empieza
  //    con `=` (char inválido para nombre). Escapar con backslash soluciona.
  //    Negative lookbehind `(?<!\\)` asegura que si el char ya está escapado
  //    (`\<=` o `\>=`), no lo volvamos a escapar — hace la operación idempotente.
  result = result.replace(/(?<![A-Za-z0-9_`\\])<=/g, "\\<=");
  result = result.replace(/(?<!\\)>=(?![A-Za-z0-9_`])/g, "\\>=");

  return result;
}

function sanitizeProse(text: string): string {
  let preProcessed = text;

  // Reparar patrones `Ident`<...>`` (backticks mal repartidos por una versión
  // previa del sanitizer). Esto se hace ANTES de splitear por inline code
  // porque los backticks de ambos lados quedan en chunks diferentes.
  preProcessed = preProcessed.replace(
    /\b([A-Z][A-Za-z0-9_]*)`(<[^`\n]+>)`/g,
    "`$1$2`",
  );

  // Fix de bold mal cerrado adyacente a inline code (Notion export): patrón
  // `**texto **` + backtick → `**texto** ` + backtick. En CommonMark, `**`
  // de cierre con espacio antes NO cierra el bold, entonces los asteriscos
  // quedan literales. Se hace ANTES del split porque los dos lados del
  // patrón viven en chunks distintos post-split.
  preProcessed = preProcessed.replace(
    /\*\*([^*\n]+?) \*\*(`)/g,
    "**$1** $2",
  );

  const chunks = preProcessed.split(INLINE_CODE_RE);
  return chunks
    .map((chunk) => (chunk.startsWith("`") ? chunk : wrapDangerousPatterns(chunk)))
    .join("");
}

/**
 * Separa frontmatter YAML del cuerpo MDX. El frontmatter NO debe sanearse
 * (es YAML que no se parsea como MDX y tiene reglas propias).
 */
function splitFrontmatter(text: string): { frontmatter: string; body: string } {
  const match = text.match(/^(---\n[\s\S]*?\n---\n)/);
  if (!match) return { frontmatter: "", body: text };
  return { frontmatter: match[0], body: text.slice(match[0].length) };
}

// Caracteres de box-drawing Unicode + arrows ASCII que identifican un
// diagrama en vez de código JS. Si el bloque tiene al menos una línea que
// comienza (ignorando whitespace) con alguno de estos, lo tratamos como
// diagrama ASCII y lo movemos a language=text para evitar syntax highlighting
// accidental (ej: "Loop" y "ESP-IDF" coloreándose como keywords).
const BOX_DRAWING_RE = /^[ \t]*[┌└│├─┤┐┘┬┴┼╔╚║╠═╣╗╝╦╩╬]/m;

/**
 * Si un code block está marcado como `javascript` (default de Notion para
 * blocks sin lenguaje) pero contiene caracteres de diagrama ASCII, lo
 * convertimos a `text` para desactivar syntax highlighting.
 */
function normalizeAsciiDiagramBlocks(text: string): string {
  return text.replace(
    /```(javascript|js)\n([\s\S]*?)\n```/g,
    (match, _lang, content: string) => {
      if (BOX_DRAWING_RE.test(content)) {
        return `\`\`\`text\n${content}\n\`\`\``;
      }
      return match;
    },
  );
}

/**
 * Sanitiza un string de MDX generado por Notion, envolviendo patrones que
 * romperían el compilador MDX. Respeta frontmatter, code blocks, inline code
 * y componentes JSX legítimos del curso.
 */
export function sanitizeMdx(text: string): string {
  const { frontmatter, body } = splitFrontmatter(text);

  // Primera pasada: normalizar diagramas ASCII mal etiquetados como javascript.
  // Se hace antes del split por fences porque opera sobre los fences mismos.
  const bodyNormalized = normalizeAsciiDiagramBlocks(body);

  const chunks = bodyNormalized.split(CODE_FENCE_RE);
  const sanitizedBody = chunks
    .map((chunk) => (chunk.startsWith("```") ? chunk : sanitizeProse(chunk)))
    .join("");

  return frontmatter + sanitizedBody;
}
