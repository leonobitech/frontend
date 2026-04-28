// ─── Financial RAG Evaluation Suite — Página del assessment final ───
//
// Server component que carga el assessment.json + valida con Zod, y pasa los
// datos al Client component AssessmentForm que maneja la UI + scoring.
//
// El `assessment.json` puede arrancar con `questions: []` durante el bootstrap.
// En ese caso mostramos un placeholder "Coming soon"; con ≥1 pregunta montamos
// el `<AssessmentForm>` shared (que lee el course config del provider en el
// layout).

import type { Metadata } from "next";

import { AssessmentForm } from "@/components/course/AssessmentForm";
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

  return (
    <div className="px-6 py-10">
      <AssessmentForm assessment={assessment} />
    </div>
  );
}
