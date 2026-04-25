#!/usr/bin/env tsx
// One-shot: aplica voseoToTuteo a todos los MDX existentes en content/rust-embedded/.
// Pensado para correr UNA sola vez y quedarse — el sync futuro ya lo aplica
// automático vía sync-notion-rust.ts. Este script está acá por si hay que
// re-aplicar después de editar MDX a mano.
//
// Uso: npx tsx scripts/apply-voseo-to-tuteo.ts [--dry-run]

import { promises as fs } from "node:fs";
import path from "node:path";

import { voseoToTuteo } from "./lib/voseo-to-tuteo";

const DIR = "content/rust-embedded";
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".mdx"));
  let totalChanges = 0;
  for (const file of files) {
    const p = path.join(DIR, file);
    const before = await fs.readFile(p, "utf8");
    const after = voseoToTuteo(before);
    if (before === after) {
      console.log(`  ${file}: sin cambios`);
      continue;
    }
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    let changes = 0;
    for (let i = 0; i < beforeLines.length; i++) {
      if (beforeLines[i] !== afterLines[i]) changes++;
    }
    totalChanges += changes;
    if (dryRun) {
      console.log(`  (dry-run) ${file}: ${changes} líneas cambiarían`);
    } else {
      await fs.writeFile(p, after, "utf8");
      console.log(`  ✓ ${file}: ${changes} líneas modificadas`);
    }
  }
  console.log(
    `\nTotal: ${totalChanges} líneas ${dryRun ? "cambiarían" : "modificadas"} en ${files.length} archivos.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
