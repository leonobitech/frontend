// ─── Course Config — Runtime compartido para assessment scoring + shuffle ───
//
// Tipos genéricos y funciones puras que el `<AssessmentForm>` shared consume.
// Cada `lib/course*/assessment.ts` define su propio Zod schema con literal
// `courseSlug` distinto — pero las funciones puras de scoring y shuffle son
// idénticas y trabajan sobre el shape común. Acá viven las versiones
// agnósticas de curso.

export type AssessmentLetter = "a" | "b" | "c" | "d";

export interface BaseAssessmentOption {
  letter: AssessmentLetter;
  text: string;
  isCorrect: boolean;
}

export interface BaseAssessmentQuestion {
  id: string;
  sourceStep: number;
  prompt: string;
  options: BaseAssessmentOption[];
  explanation: string;
}

export interface BaseAssessment {
  courseSlug: string;
  title: string;
  description: string;
  /** Threshold 0-100 — 70 = 70% de respuestas correctas. */
  passingScore: number;
  shuffle: boolean;
  questions: BaseAssessmentQuestion[];
}

export interface AssessmentAnswers {
  /** Map de questionId → letter elegida. */
  [questionId: string]: AssessmentLetter;
}

export interface AssessmentResult {
  correctCount: number;
  totalCount: number;
  /** Porcentaje 0-100. */
  score: number;
  passed: boolean;
  byQuestion: Record<
    string,
    {
      chosen: AssessmentLetter | null;
      correctLetter: AssessmentLetter;
      isCorrect: boolean;
      explanation: string;
    }
  >;
}

/**
 * Calcula el resultado del assessment dado el set de respuestas del user.
 * Maneja `totalCount === 0` (assessment vacío durante bootstrap).
 */
export function scoreAssessment(
  assessment: BaseAssessment,
  answers: AssessmentAnswers,
): AssessmentResult {
  const byQuestion: AssessmentResult["byQuestion"] = {};
  let correctCount = 0;

  for (const q of assessment.questions) {
    const correctOption = q.options.find((o) => o.isCorrect);
    if (!correctOption) continue;

    const chosen = answers[q.id] ?? null;
    const isCorrect = chosen === correctOption.letter;
    if (isCorrect) correctCount++;

    byQuestion[q.id] = {
      chosen,
      correctLetter: correctOption.letter,
      isCorrect,
      explanation: q.explanation,
    };
  }

  const totalCount = assessment.questions.length;
  const score = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
  const passed = score >= assessment.passingScore;

  return { correctCount, totalCount, score, passed, byQuestion };
}

/**
 * Shuffle estable de preguntas dado un seed (ej. userId). Usa Fisher-Yates
 * con PRNG determinístico — cada user ve mismo orden entre attempts pero
 * distinto del resto.
 */
export function shuffleQuestions<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const rand = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
