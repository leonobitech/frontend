#!/usr/bin/env tsx
// One-shot: aplica sanitizeMdx a todos los MDX en content/rust-embedded/.
// Envuelve generics Rust (`Option<T>`, `Arc<Mutex<T>>`, etc.) y `<N` en backticks
// para que MDX no los parsee como JSX. Respeta code blocks e inline code.
//
// El sync-notion-rust.ts ya aplica esto automáticamente en futuros syncs.
// Este script existe por si se editan MDX a mano y hay que re-sanitizar.
//
// Uso: npx tsx scripts/apply-sanitize-mdx.ts [--dry-run]

import { promises as fs } from "node:fs";
import path from "node:path";

import { sanitizeMdx } from "./lib/sanitize-mdx";

const DIR = "content/rust-embedded";
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".mdx"));
  let totalChanges = 0;
  for (const file of files) {
    const p = path.join(DIR, file);
    const before = await fs.readFile(p, "utf8");
    const after = sanitizeMdx(before);
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
