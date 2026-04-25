// ─── voseo → tuteo para contenido público de cursos ───
//
// Transforma español rioplatense (voseo: tenés, podés, mirá, vos, etc.) a
// español neutral/tuteo (tienes, puedes, mira, tú) para audiencia hispanohablante
// internacional.
//
// IMPORTANTE: excluye code blocks (```...```) y inline code (`...`). Los
// comentarios dentro de código tampoco se tocan — podrían tener conjugaciones
// intencionales que no queremos alterar.
//
// Esta transformación es idempotente: aplicarla N veces produce el mismo
// resultado que aplicarla 1 vez. Seguro de correr repetido.

// Diccionario de reemplazos. Cada entrada es [voseo, tuteo]. La función abajo
// genera automáticamente la versión capitalizada (Tenés → Tienes).
// Se apoya en word boundaries (\b) para no alterar palabras compuestas.
const REPLACEMENTS_LOWERCASE: Array<[string, string]> = [
  // Pronombres
  ["vos", "tú"],

  // Presente indicativo — 2ª persona
  ["tenés", "tienes"],
  ["podés", "puedes"],
  ["querés", "quieres"],
  ["hacés", "haces"],
  ["sabés", "sabes"],
  ["vés", "ves"],
  ["leés", "lees"],
  ["comés", "comes"],
  ["bebés", "bebes"],
  ["usás", "usas"],
  ["llamás", "llamas"],
  ["mandás", "mandas"],
  ["empezás", "empiezas"],
  ["encontrás", "encuentras"],
  ["pensás", "piensas"],
  ["mirás", "miras"],
  ["cambiás", "cambias"],
  ["agregás", "agregas"],
  ["chequeás", "chequeas"],
  ["trabajás", "trabajas"],
  ["necesitás", "necesitas"],
  ["intentás", "intentas"],
  ["probás", "pruebas"],
  ["estudiás", "estudias"],
  ["programás", "programas"],
  ["aprobás", "apruebas"],
  ["buscás", "buscas"],
  ["desarrollás", "desarrollas"],
  ["ayudás", "ayudas"],
  ["rompés", "rompes"],
  ["parás", "paras"],
  ["entrás", "entras"],
  ["salís", "sales"],
  ["repetís", "repites"],
  ["elegís", "eliges"],
  ["recibís", "recibes"],
  ["dormís", "duermes"],
  ["subís", "subes"],
  ["abrís", "abres"],
  ["servís", "sirves"],
  ["corrés", "corres"],
  ["cargás", "cargas"],
  ["guardás", "guardas"],
  ["pasás", "pasas"],
  ["llevás", "llevas"],
  ["volvés", "vuelves"],
  ["movés", "mueves"],
  ["armás", "armas"],
  ["mandás", "mandas"],
  ["copiás", "copias"],
  ["compilás", "compilas"],
  ["pegás", "pegas"],
  ["enviás", "envías"],
  ["escribís", "escribes"],
  ["definís", "defines"],
  ["seguís", "sigues"],
  ["construís", "construyes"],
  ["comprendés", "comprendes"],
  ["aprendés", "aprendes"],
  ["entendés", "entiendes"],
  ["perdés", "pierdes"],
  ["vendés", "vendes"],
  ["sos", "eres"],

  // Imperativo — 2ª persona (singular afirmativo)
  ["mirá", "mira"],
  ["pensá", "piensa"],
  ["fijate", "fíjate"],
  ["fijáte", "fíjate"],
  ["comparálo", "compáralo"],
  ["comparála", "compárala"],
  ["agregá", "agrega"],
  ["chequeá", "chequea"],
  ["probá", "prueba"],
  ["revisá", "revisa"],
  ["verificá", "verifica"],
  ["escribí", "escribe"],
  ["definí", "define"],
  ["seguí", "sigue"],
  ["leé", "lee"],
  ["decí", "di"],
  ["poné", "pon"],
  ["hacé", "haz"],
  ["tené", "ten"],
  ["vení", "ven"],
  ["andá", "ve"],
  ["usá", "usa"],
  ["cambiá", "cambia"],
  ["empezá", "empieza"],
  ["arrancá", "arranca"],
  ["acordáte", "acuérdate"],
  ["imagináte", "imagínate"],
  ["dejá", "deja"],
  ["tirá", "tira"],
  ["corré", "corre"],

  // Reflexivos voseo
  ["te queda", "te queda"], // igual, pero lo dejo documentado
];

const CODE_FENCE_RE = /(```[\s\S]*?```)/g;
const INLINE_CODE_RE = /(`[^`\n]+`)/g;

function capitalize(word: string): string {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}

function buildReplacementPairs(): Array<[RegExp, string]> {
  const pairs: Array<[RegExp, string]> = [];
  for (const [voseo, tuteo] of REPLACEMENTS_LOWERCASE) {
    // Escape special regex chars en el voseo (aunque nuestro dataset no tiene,
    // prevenimos para futuras adiciones).
    const escaped = voseo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // lookbehind/lookahead Unicode-aware para word boundaries que respeten
    // letras acentuadas. `\b` no funciona con tildes en JS regex.
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{M}])${escaped}(?![\\p{L}\\p{M}])`,
      "gu",
    );
    pairs.push([pattern, tuteo]);

    // Versión capitalizada (inicio de oración)
    const voseoCap = capitalize(voseo);
    const tuteoCap = capitalize(tuteo);
    if (voseoCap !== voseo) {
      const escapedCap = voseoCap.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const patternCap = new RegExp(
        `(?<![\\p{L}\\p{M}])${escapedCap}(?![\\p{L}\\p{M}])`,
        "gu",
      );
      pairs.push([patternCap, tuteoCap]);
    }
  }
  return pairs;
}

const REPLACEMENT_PAIRS = buildReplacementPairs();

function applyReplacements(text: string): string {
  let result = text;
  for (const [pattern, replacement] of REPLACEMENT_PAIRS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function transformProseChunk(text: string): string {
  // Preservar inline code. Los code fences ya fueron extraídos por el caller.
  const chunks = text.split(INLINE_CODE_RE);
  return chunks
    .map((chunk) => (chunk.startsWith("`") ? chunk : applyReplacements(chunk)))
    .join("");
}

/**
 * Transforma un string de markdown/MDX de voseo rioplatense a tuteo neutral,
 * respetando code blocks e inline code.
 */
export function voseoToTuteo(text: string): string {
  const chunks = text.split(CODE_FENCE_RE);
  return chunks
    .map((chunk) =>
      chunk.startsWith("```") ? chunk : transformProseChunk(chunk),
    )
    .join("");
}
