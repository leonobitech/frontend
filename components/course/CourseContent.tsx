// ─── Rust Embedded desde Cero — Renderer MDX del contenido del paso ───
//
// Server Component que compila MDX en el server (sin client bundle extra)
// usando next-mdx-remote/rsc. Mantiene el stack del blog existente:
//   remark-gfm         → tablas, tasklists, GFM
//   rehype-slug        → IDs en headings
//   rehype-autolink    → links clicables en headings (para TOC)
//   rehype-pretty-code → syntax highlighting Shiki (tema dual light/dark)
//
// El classname del wrapper replica la prose de BlogContent.tsx pero ajustada
// al curso: `prose-code` en customFuchsia, border-bottom en H2, etc.
//
// REQUIERE: `npm install next-mdx-remote` (dep nueva, no estaba en el lock).

import { MDXRemote } from "next-mdx-remote/rsc";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";

import { cn } from "@/lib/utils";
import { courseMdxComponents } from "./mdx-map";

interface CourseContentProps {
  /**
   * Contenido MDX **sin frontmatter**.
   *
   * CONTRATO: el caller debe parsear el frontmatter con gray-matter ANTES de
   * pasar `source` acá. Si `source` incluye el bloque `---...---`, MDXRemote
   * lo va a renderizar como texto literal porque `parseFrontmatter: false`.
   * Esto es intencional: queremos validar el frontmatter con Zod antes de
   * renderizar, y dejar que este componente se enfoque solo en el cuerpo.
   *
   * Patrón canónico:
   *   const { data, content } = matter(raw);
   *   const meta = parseCourseFrontmatter(data);
   *   return <CourseContent source={content} />;
   */
  source: string;
  className?: string;
}

// Plugins que se comparten por todas las páginas del curso. Tipado explícito
// para evitar el drift de tipos entre versiones de rehype-pretty-code.
const mdxOptions: NonNullable<MDXRemoteProps["options"]>["mdxOptions"] = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: "append" }],
    [
      rehypePrettyCode,
      {
        // Vesper — theme warm/moderno (peach + cream sobre warm-black).
        // Reemplazó a github-dark-dimmed que se sentía clásico y muy azul.
        // keepBackground=false deja que el color del container mande.
        theme: "vesper",
        keepBackground: false,
      },
    ],
  ],
};

export async function CourseContent({
  source,
  className,
}: CourseContentProps) {
  return (
    <div
      className={cn(
        "prose prose-lg max-w-none dark:prose-invert",
        // Bulk de los estilos prose vive en globals.css bajo `.course-root .prose`.
        // Acá sólo dejamos lo que es defensivo (overflow en code blocks/figures).
        "[&_figure[data-rehype-pretty-code-figure]]:max-w-full [&_figure[data-rehype-pretty-code-figure]]:overflow-x-auto",
        "[&_pre]:max-w-full [&_pre]:overflow-x-auto",
        className,
      )}
    >
      <MDXRemote
        source={source}
        components={courseMdxComponents}
        options={{
          mdxOptions,
          // Frontmatter lo parseamos con gray-matter ANTES de llamar a este
          // componente — así se valida con Zod y se usa para metadata SEO.
          // Acá lo pasamos `false` para que MDXRemote no intente parsearlo solo.
          parseFrontmatter: false,
        }}
      />
    </div>
  );
}
