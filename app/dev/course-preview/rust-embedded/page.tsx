// ─── Rust Embedded — Preview dev-only del fixture MDX ───
//
// Ruta temporal para validar visualmente las primitivas del curso (Callout,
// QuizItem, StepHero, Reflexion) y el layout (CourseSidebar, TOC, StepNav)
// renderizando el fixture.mdx contra el stack real (next-mdx-remote + prose
// + Shiki single-theme).
//
// ⚠️ Esta ruta se BORRA antes del merge a main. Existe solo durante Fase 2
//    de la integración del curso (ver "Rust Embedded desde Cero — Course
//    Automation/frontend/fase2-codigo-log.md").
//
// Para usar:
//   npm install next-mdx-remote
//   npm run dev
//   open http://localhost:3000/dev/course-preview/rust-embedded

import matter from "gray-matter";
import { promises as fs } from "node:fs";
import path from "node:path";

import { CourseContent } from "@/components/course/CourseContent";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { StepNav } from "@/components/course/StepNav";
import { TOC } from "@/components/course/TOC";
import { rustConfig } from "@/lib/course-config/configs/rust";
import { CourseConfigProvider } from "@/lib/course-config/context";
import { extractHeadings } from "@/lib/course/extract-headings";
import { parseCourseFrontmatter } from "@/lib/course/frontmatter";

export const dynamic = "force-dynamic"; // recompila en cada request durante dev

export default async function RustEmbeddedPreviewPage() {
  // Durante Fase 2.5 renombramos el fixture al slug real `paso-03-led-pwm.mdx`
  // para que también funcione la ruta canónica /courses/rust-embedded-desde-cero/
  // paso-03-led-pwm. El preview dev sigue apuntando al mismo archivo por compat.
  const fixturePath = path.join(
    process.cwd(),
    "content",
    "rust-embedded",
    "paso-03-led-pwm.mdx",
  );
  const raw = await fs.readFile(fixturePath, "utf8");

  const { data, content } = matter(raw);
  // Validación temprana: si el frontmatter está roto, mejor fallar acá en dev
  // que mostrar basura renderizada. Zod tira con mensaje claro.
  const meta = parseCourseFrontmatter(data);
  const headings = extractHeadings(content);

  return (
    <CourseConfigProvider courseSlug={rustConfig.courseSlug}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 rounded-md border border-dashed border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">
            DEV PREVIEW
          </span>{" "}
          — Fase 2.3 layout. Step {meta.step} · flavor <code>{meta.flavor}</code>{" "}
          · {meta.reading_minutes} min · {headings.length} headings detectados.
          Borrar ruta antes del merge a <code>main</code>.
        </div>

        <div className="flex gap-8">
          {/* Sidebar del curso — hidden en mobile y tablet */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-20">
              <CourseSidebar course={rustConfig} currentSlug={meta.slug} />
            </div>
          </aside>

          {/* Artículo principal + navegación entre pasos */}
          <main className="min-w-0 flex-1">
            <article className="mx-auto max-w-3xl">
              <CourseContent source={content} />
            </article>
            <div className="mx-auto max-w-3xl">
              <StepNav course={rustConfig} currentSlug={meta.slug} />
            </div>
          </main>

          {/* TOC — hidden hasta xl (tabla de contenidos es opcional en laptops chicas) */}
          <aside className="hidden w-52 shrink-0 xl:block">
            <TOC headings={headings} />
          </aside>
        </div>
      </div>
    </CourseConfigProvider>
  );
}
