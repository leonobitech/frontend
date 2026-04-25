// ─── Normalizar jerarquía de headings ───
//
// Manual editorial (§1):
//   - Un solo H1 por paso, vive en <StepHero>. Los H1 del MDX son removidos
//     (convertidos a H2) — el StepHero ya da el H1.
//   - No hay H4, H5, H6. Los H4+ del MDX son demoteados a H3.
//   - No hay H3 huérfano (sin H2 padre). Si aparece un H3 antes del primer
//     H2, lo promovemos a H2.
//
// Idempotente. Procesa line-by-line manteniendo flags `inFence` y `seenH2`
// globales (evita el bug de chunkear por code fence regex y perder estado).

/**
 * Normaliza la jerarquía de headings del MDX según el manual editorial.
 * Frontmatter intacto. Code blocks intactos (los `# comentario` adentro
 * no se tocan).
 */
export function normalizeHeadingHierarchy(text: string): string {
  const fmMatch = text.match(/^(---\n[\s\S]*?\n---\n)/);
  const frontmatter = fmMatch ? fmMatch[0] : "";
  const body = fmMatch ? text.slice(frontmatter.length) : text;

  const lines = body.split("\n");
  let inFence = false;
  let seenH2 = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Toggle code fence state. Un fence puede empezar con ``` o ~~~.
    if (/^```|^~~~/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Skip líneas vacías y líneas que no son heading
    if (!line.startsWith("#")) continue;

    // 1) H1 (`# Title`) → H2 (`## Title`). El H1 lo provee <StepHero>.
    //    `^# ` (un solo hash + espacio) NO matchea `## ` ni `### `.
    if (/^#[ \t]+/.test(line) && !line.startsWith("##")) {
      lines[i] = "## " + line.replace(/^#[ \t]+/, "");
    }

    // 2) H4+ (`#### `, `##### `, `###### `) → H3 (`### `).
    //    Sin H4+ según el manual.
    const h4plus = lines[i].match(/^(#{4,6})[ \t]+(.+)$/);
    if (h4plus) {
      lines[i] = "### " + h4plus[2];
    }

    // 3) Tracking H2 / H3 huérfano. `seenH2` persiste a través de code
    //    fences para evitar promociones incorrectas de H3 que vienen
    //    DESPUÉS de un H2 + un code block.
    const isH2 = /^##[ \t]+/.test(lines[i]) && !lines[i].startsWith("###");
    const isH3 = /^###[ \t]+/.test(lines[i]) && !lines[i].startsWith("####");

    if (isH2) {
      seenH2 = true;
    } else if (isH3 && !seenH2) {
      // H3 huérfano → promover a H2
      lines[i] = "## " + lines[i].replace(/^###[ \t]+/, "");
      seenH2 = true;
    }
  }

  return frontmatter + lines.join("\n");
}
