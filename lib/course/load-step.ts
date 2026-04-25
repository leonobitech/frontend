// ─── Rust Embedded from Zero — Loader de MDX por slug + locale ───
//
// Convención de filesystem:
//   ES — content/rust-embedded/{paso-NN-...}.mdx                    (canónico)
//   EN — content/rust-embedded/en/{step-NN-...}.mdx                  (traducción)
//
// Si se pide un paso EN y el archivo todavía no fue traducido, retornamos el
// MDX ES con `fellBackToEs: true` para que la página muestre un banner
// "Translation in progress" pero el contenido siga siendo legible.

import { promises as fs } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  parseCourseFrontmatter,
  type CourseFrontmatter,
} from "./frontmatter";
import type { Locale } from "./i18n";

const CONTENT_DIR_ES = path.join(process.cwd(), "content", "rust-embedded");
const CONTENT_DIR_EN = path.join(CONTENT_DIR_ES, "en");

export interface LoadedStep {
  /** Frontmatter validado con Zod (siempre del archivo finalmente cargado). */
  meta: CourseFrontmatter;
  /** Cuerpo MDX sin frontmatter — para pasar directo a <CourseContent source>. */
  content: string;
  /** Locale efectivamente cargado (puede diferir del solicitado si hubo fallback). */
  loadedLocale: Locale;
  /** True si pidió EN pero el archivo no existía y servimos el ES. */
  fellBackToEs: boolean;
}

function isValidSlug(slug: string): boolean {
  // Defensa contra path traversal — el regex canonical del frontmatter ya
  // garantiza esto, pero como leemos del FS, lo enforce'amos acá también.
  return /^[a-z0-9-]+$/.test(slug);
}

async function readMdx(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    // ENOENT u otros — caller decide qué hacer.
    return null;
  }
}

/**
 * Carga un paso del curso desde filesystem.
 *
 * - `esSlug` SIEMPRE es el slug canónico ES (`paso-NN-...`). El caller que
 *   recibió un slug EN debe convertirlo con `canonicalizeStepSlug()` antes.
 * - Para `locale === "en"`, intenta `content/rust-embedded/en/{step-NN-...}.mdx`
 *   primero (derivado vía `localizeStepSlug`). Si no existe, cae al ES.
 * - Retorna `null` si el archivo ES tampoco existe (slug inexistente).
 *
 * Tira un `ZodError` si el frontmatter no matchea el schema — ese caso es
 * un bug del contenido, no del UX.
 */
export async function loadStep(
  esSlug: string,
  locale: Locale = "es",
): Promise<LoadedStep | null> {
  if (!isValidSlug(esSlug)) return null;

  if (locale === "en") {
    // El slug del archivo EN se deriva del ES (lazy import pa' evitar ciclos).
    const { localizeStepSlug } = await import("./routing");
    const enSlug = localizeStepSlug(esSlug, "en");
    if (isValidSlug(enSlug)) {
      const enRaw = await readMdx(path.join(CONTENT_DIR_EN, `${enSlug}.mdx`));
      if (enRaw) {
        const { data, content } = matter(enRaw);
        const meta = parseCourseFrontmatter(data);
        return { meta, content, loadedLocale: "en", fellBackToEs: false };
      }
    }
    // EN no disponible → fall through al loader ES.
  }

  const esRaw = await readMdx(path.join(CONTENT_DIR_ES, `${esSlug}.mdx`));
  if (!esRaw) return null;

  const { data, content } = matter(esRaw);
  const meta = parseCourseFrontmatter(data);
  return {
    meta,
    content,
    loadedLocale: "es",
    fellBackToEs: locale === "en",
  };
}

/**
 * Lista todos los slugs ES presentes en `content/rust-embedded/`. Útil para
 * `generateStaticParams()` — Next.js pre-renderea una página por slug.
 *
 * Para EN, los slugs se derivan vía `listLocalizedStepSlugs()` en routing.ts —
 * no escaneamos `content/rust-embedded/en/` porque queremos pre-renderear los
 * 9 pasos EN aunque algunos todavía no estén traducidos (fallback a ES).
 */
export async function listStepSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(CONTENT_DIR_ES);
    return files
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""))
      .filter((slug) => /^paso-\d{2}-[a-z0-9-]+$/.test(slug));
  } catch {
    return [];
  }
}
