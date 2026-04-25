#!/usr/bin/env tsx
// One-shot: quita auto-links falsos generados por Notion de los MDX.
// Ver scripts/lib/strip-fake-notion-links.ts para detalles del patrón.
//
// Uso: npx tsx scripts/apply-strip-fake-links.ts [--dry-run]

import { promises as fs } from "node:fs";
import path from "node:path";

import { stripFakeNotionLinks } from "./lib/strip-fake-notion-links";

const DIR = "content/rust-embedded";
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".mdx"));
  let totalReplacements = 0;
  for (const file of files) {
    const p = path.join(DIR, file);
    const before = await fs.readFile(p, "utf8");
    const after = stripFakeNotionLinks(before);
    if (before === after) {
      console.log(`  ${file}: sin cambios`);
      continue;
    }
    // Contar ocurrencias removidas por diff de longitud del texto "http"
    const beforeCount = (before.match(/\]\(https?:\/\//g) ?? []).length;
    const afterCount = (after.match(/\]\(https?:\/\//g) ?? []).length;
    const removed = beforeCount - afterCount;
    totalReplacements += removed;
    if (dryRun) {
      console.log(`  (dry-run) ${file}: ${removed} auto-links falsos se removerían`);
    } else {
      await fs.writeFile(p, after, "utf8");
      console.log(`  ✓ ${file}: ${removed} auto-links falsos removidos`);
    }
  }
  console.log(
    `\nTotal: ${totalReplacements} auto-links ${dryRun ? "se removerían" : "removidos"} en ${files.length} archivos.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
