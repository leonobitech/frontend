// ─── Rust Embedded desde Cero — Schema + scoring del assessment (client-safe) ───
//
// Este archivo es seguro de importar desde Client Components. El loader que
// toca filesystem vive en `assessment-loader.ts` (server-only por convención).

import { z } from "zod";

// ─── Schema ───

export const assessmentOptionSchema = z.object({
  letter: z.enum(["a", "b", "c", "d"]),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

export const assessmentQuestionSchema = z.object({
  id: z.string().regex(/^q-[a-z0-9-]+$/),
  sourceStep: z.number().int().min(1).max(9),
  prompt: z.string().min(1),
  options: z
    .array(assessmentOptionSchema)
    .length(4)
    .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
      message: "Exactamente 1 opción debe tener isCorrect=true",
    }),
  explanation: z.string().min(1),
});

export const assessmentSchema = z.object({
  courseSlug: z.literal("rust-embedded-desde-cero"),
  title: z.string().min(1),
  description: z.string().min(1),
  /** Threshold 0-100 — 70 = 70% de respuestas correctas. */
  passingScore: z.number().int().min(0).max(100),
  shuffle: z.boolean(),
  questions: z.array(assessmentQuestionSchema).min(1),
});

export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;
export type AssessmentOption = z.infer<typeof assessmentOptionSchema>;

// ─── Scoring ───

export interface AssessmentAnswers {
  /** Map de questionId → letter elegida ("a" | "b" | "c" | "d"). */
  [questionId: string]: "a" | "b" | "c" | "d";
}

export interface AssessmentResult {
  correctCount: number;
  totalCount: number;
  /** Porcentaje 0-100. */
  score: number;
  passed: boolean;
  /** Por questionId: si fue correcta + la respuesta correcta + la explicación. */
  byQuestion: Record<
    string,
    {
      chosen: "a" | "b" | "c" | "d" | null;
      correctLetter: "a" | "b" | "c" | "d";
      isCorrect: boolean;
      explanation: string;
    }
  >;
}

/**
 * Calcula el resultado del assessment dado el set de respuestas del user.
 * Es seguro llamarlo con respuestas parciales — cualquier pregunta sin
 * respuesta cuenta como incorrecta.
 */
export function scoreAssessment(
  assessment: Assessment,
  answers: AssessmentAnswers,
): AssessmentResult {
  const byQuestion: AssessmentResult["byQuestion"] = {};
  let correctCount = 0;

  for (const q of assessment.questions) {
    const correctOption = q.options.find((o) => o.isCorrect);
    if (!correctOption) continue; // Schema garantiza que hay una, defensivo por las dudas

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
  const score = Math.round((correctCount / totalCount) * 100);
  const passed = score >= assessment.passingScore;

  return { correctCount, totalCount, score, passed, byQuestion };
}

/**
 * Shuffle estable de preguntas dado un seed (ej. userId). Usa Fisher-Yates
 * con un PRNG determinístico para que cada user vea el mismo orden entre
 * attempts pero distinto del resto — evita "la respuesta correcta es siempre
 * la A" y copy-paste entre users.
 */
export function shuffleQuestions<T>(items: T[], seed: string): T[] {
  // Hash simple del seed a un entero
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  // PRNG LCG
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
