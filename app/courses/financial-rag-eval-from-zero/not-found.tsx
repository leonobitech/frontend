// ─── Financial RAG Evaluation Suite — Not Found ───
//
// Se dispara cuando `loadStep` retorna null — o sea, el slug no matchea con
// ningún archivo en `content/financebench/`. Pasa típicamente cuando:
//   - Una lesson todavía no fue sincronizada desde Notion (Trigger A pendiente)
//   - El slug en la URL está deprecado / mal escrito

import Link from "next/link";

import { COURSE_BASE_URL, COURSE_TITLE } from "@/lib/course-financebench/steps";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {COURSE_TITLE}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-foreground">
        Paso no encontrado
      </h1>
      <p className="mt-4 text-muted-foreground">
        El paso que buscas no existe todavía o cambió de slug.
      </p>
      <Link
        href={COURSE_BASE_URL}
        className="mt-8 inline-block rounded-lg border border-border/60 bg-card/50 px-6 py-3 text-sm font-medium transition-colors hover:border-customFuchsia/50 hover:bg-accent/40"
      >
        Volver al índice del curso
      </Link>
    </div>
  );
}
