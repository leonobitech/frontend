#!/usr/bin/env tsx
/**
 * ─── Financial RAG Evaluation Suite — Sync Notion → MDX ────────────────────
 *
 * Extrae las páginas-memoria del curso desde el hub de Notion y las convierte
 * a archivos MDX bajo `content/financebench/`. Cada Trigger A corre este
 * script para regenerar la lesson cuya memoria descriptiva fue pulida.
 *
 * Uso:
 *   NOTION_TOKEN=secret_xxx npx tsx scripts/sync-notion-financebench.ts \
 *     [--hub <hub-page-id>] \
 *     [--out <output-dir>] \
 *     [--overrides <overrides-yaml>] \
 *     [--dry-run]
 *
 * Defaults:
 *   --hub       34f6ad30ca1181e490ffc013f47c0aec  (Proyecto Ancla — Financial RAG Eval)
 *   --out       content/financebench
 *   --overrides scripts/sync-notion-financebench.overrides.yaml
 *
 * Pre-requisitos:
 *   npm install --save-dev @notionhq/client js-yaml @types/js-yaml
 *   Crear una Notion integration (https://www.notion.so/my-integrations) con
 *   permisos de lectura, invitarla al hub "Proyecto Ancla — Financial RAG
 *   Evaluation Suite", y exportar el secret: `export NOTION_TOKEN=secret_xxx`.
 *
 * Cleanup pipeline: SE REUSA tal cual desde `scripts/lib/` (mismos transformers
 * que sync-notion-rust.ts). Los transformers son agnósticos de curso.
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

import { financebenchFrontmatterSchema } from "../lib/course-financebench/frontmatter";
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
  // Conceptos pedagógicos (reemplazan concept_rust / concept_embedded de rust).
  concept_python?: string;
  concept_rag?: string;
  // Repo monolítico — opcional, default https://github.com/FMFigueroa/financebench-rag-eval.
  repo_url?: string;
  // Anchor pattern — sin defaults derivables, deben venir de overrides.
  anchor_commit?: string;
  anchor_tag?: string;
  pr_number?: number;
  branch_checkpoint?: string;
  stage?: number;
  // Anchors a Notion (default: page ID actual).
  notion_source_id?: string;
  notion_memory_url?: string;
  // Metadata didáctica.
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

const DEFAULT_HUB = "34f6ad30ca1181e490ffc013f47c0aec";
const DEFAULT_OUT = "content/financebench";
const DEFAULT_OVERRIDES = "scripts/sync-notion-financebench.overrides.yaml";
const DEFAULT_REPO_URL = "https://github.com/FMFigueroa/financebench-rag-eval";

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
    `Uso: tsx scripts/sync-notion-financebench.ts [opciones]

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

/**
 * Acepta varios formatos de título Notion:
 *   "Stage 0 — Foundation (memoria descriptiva)"      → paso-NN-foundation (NN viene de overrides)
 *   "Stage 1 — PyTorch Fundamentals (memoria descriptiva)"
 *   "Paso 02 — PyTorch Fundamentals"                   → paso-02-pytorch-fundamentals
 *
 * Si el título matchea "Paso N — Nombre", deriva el slug directamente.
 * Si matchea "Stage N — Nombre", devuelve null (el slug debe venir del
 * override yaml — el agente lo asigna explícitamente).
 */
function titleToSlug(title: string): string | null {
  const pasoMatch = title.match(/^Paso\s+(\d+)\s*[—\-:]\s*(.+)$/i);
  if (pasoMatch) {
    const n = parseInt(pasoMatch[1], 10);
    const name = pasoMatch[2]
      .toLowerCase()
      .replace(/\(memoria\s+descriptiva\)/gi, "")
      .replace(
        /[\u{1F600}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}]/gu,
        "",
      )
      .replace(/[^a-z0-9áéíóúñ]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    return `paso-${String(n).padStart(2, "0")}-${name}`;
  }
  // "Stage N — Nombre" → no podemos derivar el step number sin el roadmap.
  // El override yaml debe asignar el slug explícitamente.
  return null;
}

function extractStepNumber(title: string, override: StepOverride): number | null {
  // Si el override tiene slug, deriva el step de ahí.
  if (override.slug) {
    const m = override.slug.match(/^paso-(\d+)-/);
    if (m) return parseInt(m[1], 10);
  }
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

/**
 * Resuelve el slug efectivo: prefiere el override.slug si existe (caso
 * "Stage N — Nombre" en Notion → slug paso-NN-... asignado en el yaml).
 * Si no, intenta derivarlo del título.
 */
function resolveSlug(
  title: string,
  overrides: OverridesFile,
): { slug: string; override: StepOverride } | null {
  // Buscar override por título → slug. Como los keys del yaml son slugs,
  // hay que matchear por contenido del override. Estrategia: si el título
  // contiene un substring que aparece en algún override.subtitle/summary,
  // úsalo; pero más simple — intentamos titleToSlug y, si devuelve null,
  // fallamos con un warning para que el dev cree el slug en el yaml.
  const derived = titleToSlug(title);
  if (derived) {
    return { slug: derived, override: overrides[derived] ?? {} };
  }
  return null;
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

  console.log(`Sync Notion → MDX (financebench)`);
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
    const resolved = resolveSlug(page.title, overrides);
    if (!resolved) {
      warnings.push({
        page: page.title,
        warning: `título no matchea patrón "Paso N — Nombre" — agregar slug explícito en el yaml o renombrar la página`,
      });
      continue;
    }

    const { slug, override } = resolved;
    const step = extractStepNumber(page.title, override);
    if (step === null) {
      warnings.push({
        page: page.title,
        warning: `step number no derivable del título ni del override.slug — skipping`,
      });
      continue;
    }

    console.log(`[${slug}] Processing "${page.title}"...`);

    try {
      const rawBlocks = await fetchChildBlocks(notion, page.id);
      const blocks = await expandBlockChildren(notion, rawBlocks);
      const pageMeta = await fetchPageMetadata(notion, page.id);

      const { mdxBody: rawMdxBody, bonusQuestion } = convertBlocksToMdx(blocks);
      // Pipeline de transformaciones idempotentes — mismo orden que rust-embedded.
      // Los transformers son agnósticos de curso y se reusan tal cual.
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

      // ─── Build frontmatter ───
      const notionUrl = pageMeta?.url ?? `https://www.notion.so/${page.id.replace(/-/g, "")}`;

      const frontmatter = {
        step,
        slug,
        title: override.subtitle ? page.title : page.title.replace(/\s*\(memoria descriptiva\)\s*$/i, ""),
        subtitle: override.subtitle ?? firstParagraph.slice(0, 120),
        summary: override.summary ?? firstParagraph.slice(0, 400),
        concept_python: override.concept_python ?? "(TODO: completar en overrides.yaml)",
        concept_rag: override.concept_rag ?? "(TODO: completar en overrides.yaml)",
        repo_url: override.repo_url ?? DEFAULT_REPO_URL,

        // Anchor pattern — REQUIRED en overrides. Si faltan, el Zod validation
        // tira y el dev sabe qué corregir.
        anchor_commit: override.anchor_commit,
        anchor_tag: override.anchor_tag,
        pr_number: override.pr_number,
        branch_checkpoint: override.branch_checkpoint,
        stage: override.stage,

        // Anchors a Notion.
        notion_memory_url: override.notion_memory_url ?? notionUrl,
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
        tags: override.tags ?? ["financebench", "rag", "evaluation"],
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

      // Warn si faltan anchors críticos.
      const missingAnchors: string[] = [];
      if (!frontmatter.anchor_commit) missingAnchors.push("anchor_commit");
      if (!frontmatter.anchor_tag) missingAnchors.push("anchor_tag");
      if (!frontmatter.pr_number) missingAnchors.push("pr_number");
      if (frontmatter.stage === undefined) missingAnchors.push("stage");
      if (missingAnchors.length) {
        warnings.push({
          page: slug,
          warning: `anchors faltantes en overrides.yaml.${slug}: ${missingAnchors.join(", ")}`,
        });
      }

      // ─── Validate con Zod ───
      const clean = Object.fromEntries(
        Object.entries(frontmatter).filter(([, v]) => v !== undefined),
      );

      let validated: Record<string, unknown>;
      const parseResult = financebenchFrontmatterSchema.safeParse(clean);
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
