#!/usr/bin/env tsx
// One-shot: limpia los separadores `---` que quedan entre preguntas del
// cuestionario (patrón `</details>` → `---` → `### Pregunta`). Los `---` son
// separadores de sección principal pero dentro de un cuestionario rompen el
// ritmo visual (ver mensaje del user: "se ve muy mal entre preguntas").
//
// Idempotente: aplicarlo N veces produce el mismo resultado.
//
// Uso: npx tsx scripts/apply-questionnaire-cleanup.ts [--dry-run]

import { promises as fs } from "node:fs";
import path from "node:path";

import { cleanupQuestionnaireSeparators } from "./lib/cleanup-questionnaire-separators";

const DIR = "content/rust-embedded";
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".mdx"));
  let totalChanges = 0;
  for (const file of files) {
    const p = path.join(DIR, file);
    const before = await fs.readFile(p, "utf8");
    const after = cleanupQuestionnaireSeparators(before);
    if (before === after) {
      console.log(`  ${file}: sin cambios`);
      continue;
    }
    const beforeLines = before.split("\n").length;
    const afterLines = after.split("\n").length;
    const delta = beforeLines - afterLines;
    totalChanges += delta;
    if (dryRun) {
      console.log(`  (dry-run) ${file}: ${delta} líneas de separador se removerían`);
    } else {
      await fs.writeFile(p, after, "utf8");
      console.log(`  ✓ ${file}: ${delta} líneas de separador removidas`);
    }
  }
  console.log(`\nTotal: ${totalChanges} líneas removidas en ${files.length} archivos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
