// ─── Aplanar callouts anidados ───
//
// Prohibido por el manual editorial (§3): un <Callout> no puede contener
// otro <Callout>. Notion a veces exporta así porque el editor permite
// quote-dentro-de-quote. Este módulo detecta ese patrón y aplana.
//
// Estrategia simple: si encontramos `<Callout ...>...<Callout ...>...</Callout>...</Callout>`,
// reemplazamos el inner Callout por un párrafo bold con su texto y removemos
// las tags del inner. El outer permanece.
//
// Idempotente. Respeta code blocks (no busca en código).

const CODE_FENCE_RE = /(```[\s\S]*?```)/g;

/**
 * Detecta callouts anidados (Callout dentro de Callout) y los aplana,
 * reemplazando el callout interno por un párrafo bold.
 */
function flattenInProse(text: string): string {
  let result = text;
  let madeChange = true;
  let iterations = 0;
  // Iterar hasta que no haya más anidaciones (hasta 5 niveles defensivos)
  while (madeChange && iterations < 5) {
    madeChange = false;
    iterations++;

    // Pattern: <Callout ...?>(outer)<Callout ...?>(inner)</Callout>(resto outer)</Callout>
    // Aceptamos `<Callout>` sin atributos también (eso era el bug previo —
    // el regex requería `\s` que falla con la forma simple).
    const nestedRe =
      /(<Callout(?:\s[^>]*)?>[\s\S]*?)<Callout(?:\s[^>]*)?>([\s\S]*?)<\/Callout>([\s\S]*?<\/Callout>)/;

    if (nestedRe.test(result)) {
      result = result.replace(nestedRe, (_, beforeInner, innerContent, afterInner) => {
        const cleanedInner = innerContent.trim();
        const flatInner = cleanedInner.includes("\n\n")
          ? `\n\n${cleanedInner}\n\n`
          : `\n\n**${cleanedInner.replace(/^\*+|\*+$/g, "")}**\n\n`;
        madeChange = true;
        return beforeInner + flatInner + afterInner;
      });
    }
  }
  return result;
}

/**
 * Aplana callouts anidados en MDX. Respeta code blocks.
 */
export function flattenNestedCallouts(text: string): string {
  const chunks = text.split(CODE_FENCE_RE);
  return chunks
    .map((chunk) => (chunk.startsWith("```") ? chunk : flattenInProse(chunk)))
    .join("");
}
