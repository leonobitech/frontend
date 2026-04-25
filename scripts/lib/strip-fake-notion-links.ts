// ─── Remover auto-links falsos generados por Notion ───
//
// Notion detecta cualquier texto tipo `nombre.ext` como si fuera un dominio
// real y lo convierte automáticamente en un link. El resultado: el MDX
// exportado tiene cosas como `[`main.rs`](http://main.rs/)` que apuntan a
// dominios **reales externos** (`main.rs` es un dominio de Serbia), los
// cuales pueden ser squatters, pages phishing, o malware. Es un vector de
// seguridad para los alumnos del curso.
//
// Este módulo:
//   1. Detecta `[`name.ext`](http://name.ext/)` donde el href === texto
//      linkeado → auto-link basura → lo reemplaza por `` `name.ext` ``
//   2. Detecta el patrón partido tipo `` `prefix_`[`suffix.ext`](http://suffix.ext/) ``
//      → lo unifica en `` `prefix_suffix.ext` ``
//
// Respeta links legítimos: si el href difiere del texto (ej. link a GitHub),
// NO se toca.
//
// Idempotente.

/**
 * Quita auto-links falsos generados por Notion del MDX.
 */
export function stripFakeNotionLinks(text: string): string {
  let result = text;

  // Flag `i` hace los backreferences case-insensitive — captura casos como
  // `[X.rs](http://x.rs/)` o `[FORM.as](http://form.as/)` donde Notion
  // lowercasea el hostname pero el texto visible está en mayúscula.

  // 1. Patrón partido: `prefix_`[`suffix`](http://suffix/)
  //    Notion rompe algunos nombres en dos si tienen underscore u otro char
  //    que interpreta como boundary. Los reunimos en un solo inline code.
  //    Backreference \2 garantiza que el href === texto linkeado.
  result = result.replace(
    /`([^`\n]+?)`\s*\[`([^`\n]+?)`\]\(https?:\/\/\2\/?\)/gi,
    "`$1$2`",
  );

  // 2. Patrón simple: [`name`](http://name/) donde href === texto
  //    → solo inline code, sin link. Backreference \1.
  result = result.replace(
    /\[`([^`\n]+?)`\]\(https?:\/\/\1\/?\)/gi,
    "`$1`",
  );

  // 3. Variante sin backticks: [name.ext](http://name.ext/)
  //    Menos común pero pasa. Mismo check de backref.
  result = result.replace(
    /\[([A-Za-z0-9_./-]+?)\]\(https?:\/\/\1\/?\)/gi,
    "`$1`",
  );

  return result;
}
