// ─── Rust Embedded desde Cero — Página del assessment final ───
//
// Server component que carga el assessment.json + valida con Zod, y pasa los
// datos al Client component AssessmentForm que maneja la UI + scoring.
//
// Auth está cubierto por el layout del curso (redirect a login si no auth).

import type { Metadata } from "next";

import { AssessmentForm } from "@/components/course/AssessmentForm";
import { loadAssessment } from "@/lib/course/assessment-loader";
import { COURSE_TITLE } from "@/lib/course/steps";

export const metadata: Metadata = {
  title: `Assessment final — ${COURSE_TITLE} | Leonobitech`,
  description:
    "9 preguntas meta-integradoras para validar tu manejo de los conceptos del curso. 70% para aprobar.",
};

export default async function AssessmentPage() {
  const assessment = await loadAssessment();

  return (
    <div className="px-6 py-10">
      <AssessmentForm assessment={assessment} />
    </div>
  );
}
