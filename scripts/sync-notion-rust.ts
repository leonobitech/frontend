#!/usr/bin/env tsx
/**
 * ─── Rust Embedded desde Cero — Sync Notion → MDX ──────────────────────────
 *
 * Extrae las 9 páginas del curso desde el hub de Notion y las convierte a
 * archivos MDX bajo `content/rust-embedded/`. Se corre **una sola vez** al
 * importar el curso — después de eso, el MDX en git es la fuente de verdad.
 *
 * Uso:
 *   NOTION_TOKEN=secret_xxx npx tsx scripts/sync-notion-rust.ts \
 *     [--hub <hub-page-id>] \
 *     [--out <output-dir>] \
 *     [--overrides <overrides-yaml>] \
 *     [--dry-run]
 *
 * Defaults:
 *   --hub       2f76ad30ca1181039140ccb0959c2b0f  (hub del curso)
 *   --out       content/rust-embedded
 *   --overrides scripts/sync-notion-rust.overrides.yaml
 *
 * Pre-requisitos:
 *   npm install --save-dev @notionhq/client js-yaml @types/js-yaml
 *   Crear una Notion integration (https://www.notion.so/my-integrations) con
 *   permisos de lectura, invitarla al hub "Rust Embedded desde Cero", y exportar
 *   el secret: `export NOTION_TOKEN=secret_xxx`.
 *
 * Este script es infra de desarrollo — NO se empaqueta en producción.
 */

import { Client, isFullBlock, isFullPage } from "@notionhq/client";
import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import * as yaml from "js-yaml";
import { promises as fs } from "node:fs";
import * as path from "node:path";

import { courseFrontmatterSchema } from "../lib/course/frontmatter";
import {
  convertBlocksToMdx,
  type ExtendedBlock,
} from "./lib/notion-to-mdx";
import { cleanupQuestionnaireSeparators } from "./lib/cleanup-questionnaire-separators";
import { flattenNestedCallouts } from "./lib/flatten-nested-callouts";
import { normalizeCalloutTypes } from "./lib/normalize-callout-types";
import { normalizeHeadingHierarchy } from "./lib/normalize-heading-hierarchy";
import { sanitizeMdx } from "./lib/sanitize-mdx";
import { stripDecorativeEmojis } from "./lib/strip-decorative-emojis";
import { stripFakeNotionLinks } from "./lib/strip-fake-notion-links";
import { stripH3ManualNumbers } from "./lib/strip-h3-manual-numbers";
import { voseoToTuteo } from "./lib/voseo-to-tuteo";

// ─── Types ───

interface StepOverride {
  slug?: string;
  subtitle?: string;
  summary?: string;
  concept_rust?: string;
  concept_embedded?: string;
  repo_url?: string;
  notion_source_id?: string;
  reading_minutes?: number;
  flavor?: "simple" | "complex";
  tags?: string[];
  bonus_question?: {
    distractors?: [string, string, string];
  };
  published_at?: string;
}

type OverridesFile = Record<string, StepOverride>;

interface Args {
  hub: string;
  out: string;
  overrides: string;
  dryRun: boolean;
}

// ─── Constantes ───

const DEFAULT_HUB = "2f76ad30ca1181039140ccb0959c2b0f";
const DEFAULT_OUT = "content/rust-embedded";
const DEFAULT_OVERRIDES = "scripts/sync-notion-rust.overrides.yaml";

// ─── CLI ───

function parseArgs(argv: string[]): Args {
  const args: Args = {
    hub: DEFAULT_HUB,
    out: DEFAULT_OUT,
    overrides: DEFAULT_OVERRIDES,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--hub":
        args.hub = argv[++i];
        break;
      case "--out":
        args.out = argv[++i];
        break;
      case "--overrides":
        args.overrides = argv[++i];
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
    }
  }
  return args;
}

function printHelp(): void {
  console.log(
    `Uso: tsx scripts/sync-notion-rust.ts [opciones]

Opciones:
  --hub <id>         Hub page ID (default: ${DEFAULT_HUB})
  --out <dir>        Output directory (default: ${DEFAULT_OUT})
  --overrides <file> YAML de overrides (default: ${DEFAULT_OVERRIDES})
  --dry-run          No escribir archivos, solo reportar
  --help             Mostrar esta ayuda

Environment:
  NOTION_TOKEN       Integration secret (obligatorio)
`,
  );
}

// ─── Notion fetchers ───

async function fetchChildBlocks(
  notion: Client,
  parentId: string,
): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.blocks.children.list({
      block_id: parentId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const b of res.results) {
      if (isFullBlock(b)) blocks.push(b);
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return blocks;
}

/**
 * Expande recursivamente children de blocks que tienen `has_children: true`.
 * El API de Notion solo trae el primer nivel — toggles/listas/callouts con
 * sub-contenido requieren follow-up fetches.
 */
async function expandBlockChildren(
  notion: Client,
  blocks: BlockObjectResponse[],
): Promise<ExtendedBlock[]> {
  const result: ExtendedBlock[] = [];
  for (const block of blocks) {
    const extended = block as ExtendedBlock;
    if (block.has_children) {
      const children = await fetchChildBlocks(notion, block.id);
      extended.children = await expandBlockChildren(notion, children);
    }
    result.push(extended);
  }
  return result;
}

async function fetchHubChildPages(
  notion: Client,
  hubId: string,
): Promise<{ id: string; title: string }[]> {
  const blocks = await fetchChildBlocks(notion, hubId);
  const pages: { id: string; title: string }[] = [];
  for (const b of blocks) {
    if (b.type === "child_page") {
      pages.push({ id: b.id, title: b.child_page.title });
    }
  }
  return pages;
}

async function fetchPageMetadata(
  notion: Client,
  pageId: string,
): Promise<PageObjectResponse | null> {
  const page = await notion.pages.retrieve({ page_id: pageId });
  return isFullPage(page) ? page : null;
}

// ─── Slug + frontmatter derivation ───

function titleToSlug(title: string): string | null {
  // Acepta "Paso N — Nombre", "Paso N - Nombre", "Paso N: Nombre"
  const match = title.match(/^Paso\s+(\d+)\s*[—\-:]\s*(.+)$/i);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const name = match[2]
    .toLowerCase()
    // Remove emojis y símbolos
    .replace(
      /[\u{1F600}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}]/gu,
      "",
    )
    // Acentos y letras normales permitidas → reemplazar el resto con -
    .replace(/[^a-z0-9áéíóúñ]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    // Strip acentos finalmente (los slugs deben ser ASCII)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return `paso-${String(n).padStart(2, "0")}-${name}`;
}

function extractStepNumber(title: string): number | null {
  const match = title.match(/^Paso\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function computeReadingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function findFirstParagraph(blocks: ExtendedBlock[]): string {
  for (const b of blocks) {
    if (b.type !== "paragraph") continue;
    const text = b.paragraph.rich_text.map((rt) => rt.plain_text).join("").trim();
    if (text) return text;
  }
  return "";
}

// ─── Overrides ───

async function loadOverrides(overridesPath: string): Promise<OverridesFile> {
  try {
    const raw = await fs.readFile(overridesPath, "utf8");
    const parsed = yaml.load(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as OverridesFile;
    }
    return {};
  } catch (err) {
    console.warn(
      `⚠ No se pudo leer overrides (${overridesPath}): ${
        err instanceof Error ? err.message : String(err)
      }. Continuando sin overrides.`,
    );
    return {};
  }
}

// ─── Main ───

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    console.error(
      "✗ NOTION_TOKEN env var no seteada. Creá una integration interna en\n" +
        "  https://www.notion.so/my-integrations, invitala al hub, y exportá el secret.",
    );
    process.exit(1);
  }

  console.log(`Sync Notion → MDX`);
  console.log(`  hub:       ${args.hub}`);
  console.log(`  out:       ${args.out}`);
  console.log(`  overrides: ${args.overrides}`);
  console.log(`  dry-run:   ${args.dryRun}\n`);

  const notion = new Client({ auth: token });
  const overrides = await loadOverrides(args.overrides);

  console.log("Fetching child pages del hub...");
  const pages = await fetchHubChildPages(notion, args.hub);
  console.log(`  → ${pages.length} páginas encontradas\n`);

  if (!args.dryRun) {
    await fs.mkdir(args.out, { recursive: true });
  }

  const errors: Array<{ page: string; error: string }> = [];
  const warnings: Array<{ page: string; warning: string }> = [];
  const extractedBonus: Array<{ slug: string; prompt: string }> = [];

  for (const page of pages) {
    const step = extractStepNumber(page.title);
    const slug = titleToSlug(page.title);
    if (step === null || slug === null) {
      warnings.push({
        page: page.title,
        warning: `título no matchea patrón "Paso N — Nombre" — skipping`,
      });
      continue;
    }

    console.log(`[${slug}] Processing "${page.title}"...`);

    try {
      const rawBlocks = await fetchChildBlocks(notion, page.id);
      const blocks = await expandBlockChildren(notion, rawBlocks);
      const pageMeta = await fetchPageMetadata(notion, page.id);

      const { mdxBody: rawMdxBody, bonusQuestion } = convertBlocksToMdx(blocks);
      // Pipeline de transformaciones idempotentes sobre el MDX. Aplicación
      // del manual editorial (docs/course-editorial-manual.md):
      //   1. voseoToTuteo:                ES rioplatense → neutral (§8 manual)
      //   2. sanitizeMdx:                 generics Rust + escapar `<=`
      //   3. cleanupQuestionnaireSeparators: `---` redundantes
      //   4. stripFakeNotionLinks:        auto-links a dominios externos
      //   5. stripDecorativeEmojis:       sin emojis en docs (§4)
      //   6. flattenNestedCallouts:       no callouts anidados (§3)
      //   7. normalizeCalloutTypes:       8 colores → info / warning (§3)
      //   8. normalizeHeadingHierarchy:   un solo H1, sin H4+, sin H3 huérfano (§1)
      // Todas respetan code blocks, inline code y frontmatter.
      const mdxBody = stripH3ManualNumbers(
        normalizeHeadingHierarchy(
          normalizeCalloutTypes(
            flattenNestedCallouts(
              stripDecorativeEmojis(
                stripFakeNotionLinks(
                  cleanupQuestionnaireSeparators(
                    sanitizeMdx(voseoToTuteo(rawMdxBody)),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      const firstParagraph = findFirstParagraph(blocks);
      const override = overrides[slug] ?? {};

      // ─── Build frontmatter ───
      const frontmatter = {
        step,
        slug,
        title: page.title,
        subtitle: override.subtitle ?? firstParagraph.slice(0, 120),
        summary: override.summary ?? firstParagraph.slice(0, 400),
        concept_rust: override.concept_rust ?? "(TODO: completar en overrides.yaml)",
        concept_embedded:
          override.concept_embedded ?? "(TODO: completar en overrides.yaml)",
        repo_url: override.repo_url ?? `https://github.com/FMFigueroa/${slug}`,
        notion_source_id: override.notion_source_id ?? page.id,
        reading_minutes:
          override.reading_minutes ?? computeReadingMinutes(mdxBody),
        flavor: override.flavor ?? (blocks.length > 40 ? "complex" : "simple"),
        bonus_question:
          bonusQuestion && override.bonus_question?.distractors
            ? {
                prompt: bonusQuestion.prompt,
                correct: bonusQuestion.correct,
                distractors: override.bonus_question.distractors,
                explanation: bonusQuestion.explanation || bonusQuestion.correct,
              }
            : undefined,
        tags: override.tags ?? ["rust", "embedded", "esp32"],
        published_at:
          override.published_at ??
          (pageMeta?.created_time
            ? pageMeta.created_time.slice(0, 10)
            : undefined),
      };

      // Warn si falta bonus_question (flag pero no abortar — puede completarse después)
      if (!frontmatter.bonus_question) {
        warnings.push({
          page: slug,
          warning: bonusQuestion
            ? `bonus question extraída pero faltan distractors en overrides.yaml.${slug}.bonus_question.distractors`
            : `no se pudo extraer bonus question del contenido — agregá prompt/correct/distractors manualmente`,
        });
      }

      // ─── Validate con Zod ───
      // Si falta bonus_question, la validación falla. Lo manejamos lanzando
      // un warn y escribiendo igual (para que el dev lo complete a mano).
      const clean = Object.fromEntries(
        Object.entries(frontmatter).filter(([, v]) => v !== undefined),
      );

      let validated: Record<string, unknown>;
      const parseResult = courseFrontmatterSchema.safeParse(clean);
      if (parseResult.success) {
        validated = parseResult.data as unknown as Record<string, unknown>;
      } else {
        errors.push({
          page: slug,
          error: `Zod validation: ${parseResult.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")}`,
        });
        // Escribir igual — el dev lo ve y corrige
        validated = clean;
      }

      if (bonusQuestion) {
        extractedBonus.push({ slug, prompt: bonusQuestion.prompt });
      }

      // ─── Write MDX ───
      const outPath = path.join(args.out, `${slug}.mdx`);
      const output = `---\n${yaml.dump(validated, {
        lineWidth: 120,
        noRefs: true,
      })}---\n\n${mdxBody}\n`;

      if (args.dryRun) {
        console.log(
          `   (dry-run) would write ${outPath} — ${output.length} bytes`,
        );
      } else {
        await fs.writeFile(outPath, output, "utf8");
        console.log(`   ✓ ${outPath} — ${output.length} bytes`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ page: slug, error: msg });
      console.error(`   ✗ Error: ${msg}`);
    }
  }

  // ─── Resumen ───
  console.log(`\n─── Resumen ───`);
  console.log(`  Procesadas:   ${pages.length}`);
  console.log(`  Warnings:     ${warnings.length}`);
  console.log(`  Errores:      ${errors.length}`);

  if (warnings.length) {
    console.log(`\n  ⚠ Warnings:`);
    for (const w of warnings) console.log(`    [${w.page}] ${w.warning}`);
  }
  if (errors.length) {
    console.log(`\n  ✗ Errores:`);
    for (const e of errors) console.error(`    [${e.page}] ${e.error}`);
  }

  if (extractedBonus.length) {
    console.log(
      `\n  Bonus prompts extraídas (revisar + agregar distractors en overrides.yaml):`,
    );
    for (const bq of extractedBonus) {
      console.log(`    [${bq.slug}] ${bq.prompt}`);
    }
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
