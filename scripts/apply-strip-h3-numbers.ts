#!/usr/bin/env tsx
// One-shot: limpia los `### N. Texto` manuales para que el counter CSS
// `a.-`/`b.-` no genere doble numeración. Ver scripts/lib/strip-h3-manual-numbers.ts.

import { promises as fs } from "node:fs";
import path from "node:path";

import { stripH3ManualNumbers } from "./lib/strip-h3-manual-numbers";

const DIR = "content/rust-embedded";

async function main() {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".mdx"));
  let total = 0;
  for (const file of files) {
    const p = path.join(DIR, file);
    const before = await fs.readFile(p, "utf8");
    const after = stripH3ManualNumbers(before);
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
    await fs.writeFile(p, after, "utf8");
    total += changes;
    console.log(`  ✓ ${file}: ${changes} H3 limpiados`);
  }
  console.log(`\nTotal: ${total} H3 con número manual limpiados`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
