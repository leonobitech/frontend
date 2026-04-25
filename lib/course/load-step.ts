// ─── Rust Embedded desde Cero — Loader de MDX por slug ───
//
// Utility compartido entre el player (/app/courses/rust-embedded-desde-cero/
// [stepSlug]/page.tsx) y cualquier otra ruta que necesite levantar el contenido
// de un paso desde filesystem.
//
// Convención: los MDX viven en `content/rust-embedded/{slug}.mdx`. El slug
// matchea el del frontmatter y el de los repos GitHub (paso-0N-nombre).

import { promises as fs } from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  parseCourseFrontmatter,
  type CourseFrontmatter,
} from "./frontmatter";

const CONTENT_DIR = path.join(process.cwd(), "content", "rust-embedded");

export interface LoadedStep {
  /** Frontmatter validado con Zod. */
  meta: CourseFrontmatter;
  /** Cuerpo MDX sin frontmatter — para pasar directo a <CourseContent source>. */
  content: string;
}

/**
 * Carga un paso del curso desde filesystem.
 *
 * Retorna `null` si el archivo no existe — permite al caller renderizar un 404
 * en vez de tirar excepción (p.ej. si un slug deprecado queda en links).
 *
 * Tira un `ZodError` si el frontmatter no matchea el schema — ese caso sí es
 * un bug del contenido (MDX mal formateado), no del UX.
 */
export async function loadStep(slug: string): Promise<LoadedStep | null> {
  // Defensa contra path traversal: los slugs válidos son solo
  // letras, números y guiones. El regex canonical del frontmatter ya lo cubre,
  // pero lo repetimos acá porque este file system read es un vector de riesgo.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    // ENOENT → archivo no existe → caller muestra not-found.
    // Cualquier otro error (permission, etc.) también se trata como "no se
    // puede cargar" para no filtrar detalles de fs al cliente.
    return null;
  }

  const { data, content } = matter(raw);
  const meta = parseCourseFrontmatter(data);
  return { meta, content };
}

/**
 * Lista todos los slugs de pasos presentes en `content/rust-embedded/`. Útil
 * para `generateStaticParams()` — Next.js pre-renderea una página por slug
 * en build time.
 */
export async function listStepSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    return files
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""))
      .filter((slug) => /^paso-\d{2}-[a-z0-9-]+$/.test(slug));
  } catch {
    return [];
  }
}
