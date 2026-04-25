#!/usr/bin/env tsx
// One-shot: aplica las 4 transformaciones editoriales del manual sobre los MDX:
//   - stripDecorativeEmojis (§4 del manual)
//   - flattenNestedCallouts (§3)
//   - normalizeCalloutTypes (§3)
//   - normalizeHeadingHierarchy (§1)
//
// Idempotente. El sync-notion-rust.ts también las aplica automático en cada
// resync. Este script existe para correr sobre MDX editados a mano.
//
// Uso: npx tsx scripts/apply-editorial-cleanup.ts [--dry-run]

import { promises as fs } from "node:fs";
import path from "node:path";

import { flattenNestedCallouts } from "./lib/flatten-nested-callouts";
import { normalizeCalloutTypes } from "./lib/normalize-callout-types";
import { normalizeHeadingHierarchy } from "./lib/normalize-heading-hierarchy";
import { stripDecorativeEmojis } from "./lib/strip-decorative-emojis";

const DIR = "content/rust-embedded";
const dryRun = process.argv.includes("--dry-run");

interface FileResult {
  file: string;
  emojisRemoved: number;
  flattenedCallouts: number;
  retypedCallouts: number;
  changedHeadings: number;
}

const EMOJI_RE =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F100}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1FA00}-\u{1FAFF}]/gu;

async function main() {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".mdx"));
  const results: FileResult[] = [];

  for (const file of files) {
    const p = path.join(DIR, file);
    const before = await fs.readFile(p, "utf8");

    const beforeEmojis = (before.match(EMOJI_RE) ?? []).length;
    const beforeColorAttr = (before.match(/<Callout[^>]*color=/g) ?? []).length;
    const beforeIconAttr = (before.match(/<Callout[^>]*icon=/g) ?? []).length;
    const beforeH1 = (before.match(/^#[ \t]+/gm) ?? []).length;
    const beforeH4plus = (before.match(/^#{4,6}[ \t]+/gm) ?? []).length;

    let after = before;
    after = stripDecorativeEmojis(after);
    after = flattenNestedCallouts(after);
    after = normalizeCalloutTypes(after);
    after = normalizeHeadingHierarchy(after);

    if (after === before) {
      console.log(`  ${file}: sin cambios`);
      continue;
    }

    const afterEmojis = (after.match(EMOJI_RE) ?? []).length;
    const afterColorAttr = (after.match(/<Callout[^>]*color=/g) ?? []).length;
    const afterH1 = (after.match(/^#[ \t]+/gm) ?? []).length;
    const afterH4plus = (after.match(/^#{4,6}[ \t]+/gm) ?? []).length;

    const result: FileResult = {
      file,
      emojisRemoved: beforeEmojis - afterEmojis,
      flattenedCallouts: 0, // approximate
      retypedCallouts: (beforeColorAttr - afterColorAttr) + beforeIconAttr,
      changedHeadings: (beforeH1 - afterH1) + (beforeH4plus - afterH4plus),
    };
    results.push(result);

    if (dryRun) {
      console.log(
        `  (dry-run) ${file}: ${result.emojisRemoved} emojis, ${result.retypedCallouts} callouts normalizados, ${result.changedHeadings} headings`,
      );
    } else {
      await fs.writeFile(p, after, "utf8");
      console.log(
        `  ✓ ${file}: ${result.emojisRemoved} emojis, ${result.retypedCallouts} callouts normalizados, ${result.changedHeadings} headings`,
      );
    }
  }

  const totalEmojis = results.reduce((s, r) => s + r.emojisRemoved, 0);
  const totalCallouts = results.reduce((s, r) => s + r.retypedCallouts, 0);
  const totalHeadings = results.reduce((s, r) => s + r.changedHeadings, 0);
  console.log(
    `\nTotal: ${totalEmojis} emojis · ${totalCallouts} callouts · ${totalHeadings} headings ${dryRun ? "cambiarían" : "modificados"}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
