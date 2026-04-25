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
 * Para EN, los slugs se derivan vía `listLocalizedStepSlugs()` en routing.ts.
 * Se usa solo después de filtrar con `hasStepMdx(slug, "en")` para no
 * pre-renderear pasos EN que no tengan traducción real.
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

/**
 * ¿Existe el MDX traducido para `(esSlug, locale)`?
 *
 * - Locale ES siempre devuelve `true` si el archivo ES existe (el ES es la
 *   fuente de verdad).
 * - Locale EN devuelve `true` solo si `content/rust-embedded/en/{step-NN}.mdx`
 *   existe.
 *
 * Usado por:
 *   1. `app/en/.../[stepSlug]/page.tsx` para devolver `notFound()` cuando el
 *      step EN aún no está traducido (en lugar de mostrar fallback ES con banner).
 *   2. `app/courses/.../[stepSlug]/page.tsx` para que el LocaleSwitcher
 *      apunte al landing EN si no hay step EN traducido.
 *   3. `next-sitemap.config.js` (vía script auxiliar) para excluir step EN
 *      sin MDX y evitar soft 404.
 */
export async function hasStepMdx(
  esSlug: string,
  locale: Locale,
): Promise<boolean> {
  if (!isValidSlug(esSlug)) return false;

  if (locale === "es") {
    return readMdx(path.join(CONTENT_DIR_ES, `${esSlug}.mdx`)).then(
      (raw) => raw !== null,
    );
  }

  const { localizeStepSlug } = await import("./routing");
  const enSlug = localizeStepSlug(esSlug, "en");
  if (!isValidSlug(enSlug)) return false;
  return readMdx(path.join(CONTENT_DIR_EN, `${enSlug}.mdx`)).then(
    (raw) => raw !== null,
  );
}

/**
 * Lista los slugs ES canónicos que SÍ tienen MDX traducido al locale dado.
 * Usado por `generateStaticParams()` del step page EN para pre-renderear
 * únicamente los pasos que estén traducidos.
 */
export async function listTranslatedStepSlugs(
  locale: Locale,
): Promise<string[]> {
  const all = await listStepSlugs();
  if (locale === "es") return all;
  const checks = await Promise.all(
    all.map(async (slug) => ((await hasStepMdx(slug, "en")) ? slug : null)),
  );
  return checks.filter((s): s is string => s !== null);
}
