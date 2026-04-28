// ─── Financial RAG Evaluation Suite — Página del assessment final ───
//
// Server component que carga el assessment.json + valida con Zod, y pasa los
// datos al Client component AssessmentForm que maneja la UI + scoring.
//
// Nota — Bootstrap (Misión 0): el `assessment.json` arranca con `questions: []`.
// La UI de `AssessmentForm` está pensada para ≥1 pregunta. Mientras el
// assessment esté vacío, mostramos un placeholder "Coming soon" en lugar de
// montar el componente. Cada Trigger A agrega su pregunta correspondiente.

import type { Metadata } from "next";

import { loadAssessment } from "@/lib/course-financebench/assessment-loader";
import { COURSE_TITLE } from "@/lib/course-financebench/steps";

export const metadata: Metadata = {
  title: `Assessment final — ${COURSE_TITLE} | Leonobitech`,
  description:
    "Preguntas meta-integradoras, una por lesson. Necesitás 70% para aprobar y reclamar tu certificado.",
};

export default async function AssessmentPage() {
  const assessment = await loadAssessment();
  const hasQuestions = assessment.questions.length > 0;

  if (!hasQuestions) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {assessment.title}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">
          Assessment próximamente
        </h1>
        <p className="mt-4 text-muted-foreground">
          {assessment.description}
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          El assessment se llena lesson por lesson — cada Trigger A agrega
          su pregunta meta-integradora. Volvé cuando se publiquen las
          primeras lessons.
        </p>
      </div>
    );
  }

  // TODO (post-Misión 0): adaptar AssessmentForm al course config de
  // financebench (hoy hardcodea links a /courses/rust-embedded-desde-cero/).
  // Mientras tanto, mostrar un fallback que liste las preguntas.
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground">{assessment.title}</h1>
      <p className="mt-3 text-muted-foreground">{assessment.description}</p>
      <p className="mt-6 text-sm italic text-muted-foreground">
        UI del assessment pendiente — el formulario actual está acoplado a
        rust-embedded. Próximo paso: adaptar AssessmentForm al course config.
      </p>
      <ul className="mt-8 space-y-4">
        {assessment.questions.map((q) => (
          <li key={q.id} className="rounded-lg border border-border/60 bg-card/30 p-4">
            <p className="font-mono text-xs text-muted-foreground">
              Lesson {String(q.sourceStep).padStart(2, "0")}
            </p>
            <p className="mt-1 text-base text-foreground">{q.prompt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
