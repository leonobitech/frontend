// ─── UI del assessment final — parametrizada por curso ───
//
// Client component. Manual editorial aplicado: tipografía Fraunces para hero,
// kickers mono uppercase, accent del curso, sin emojis.
//
// El config del curso se lee del context vía `useCourseConfig()` (debe haber
// un <CourseConfigProvider> arriba en el layout). El assessment llega con
// shape `BaseAssessment` (agnóstico de courseSlug literal) — el caller server
// lo carga del lib específico del curso y lo pasa tal cual.

"use client";

import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  scoreAssessment,
  shuffleQuestions,
  type AssessmentAnswers,
  type AssessmentResult,
  type BaseAssessment,
} from "@/lib/course-config/assessment-runtime";
import { useCourseConfig } from "@/lib/course-config/context";
import { cn } from "@/lib/utils";

interface AssessmentFormProps {
  assessment: BaseAssessment;
  /** Seed de shuffle — típicamente el userId. Si no, usa "anon". */
  shuffleSeed?: string;
}

export function AssessmentForm({
  assessment,
  shuffleSeed = "anon",
}: AssessmentFormProps) {
  const course = useCourseConfig();
  const questions = useMemo(
    () =>
      assessment.shuffle
        ? shuffleQuestions(assessment.questions, shuffleSeed)
        : assessment.questions,
    [assessment, shuffleSeed],
  );

  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  function handleSelect(qid: string, letter: "a" | "b" | "c" | "d") {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [qid]: letter }));
  }

  async function handleSubmit() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    const computed = scoreAssessment(assessment, answers);
    setResult(computed);

    try {
      await fetch(`${course.lmsApiBase}/${course.courseSlug}/assessment/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          answers,
          score: computed.score,
          passed: computed.passed,
        }),
      });
    } catch {
      /* tracking best-effort */
    }
    setSubmitting(false);
    requestAnimationFrame(() => {
      document
        .getElementById("assessment-result")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="course-root mx-auto max-w-3xl px-5 py-14 md:py-20">
      {/* ─── Hero ─── */}
      <header className="mb-12 border-b border-[color:var(--course-border-strong)] pb-10">
        <p className="course-kicker mb-4">Assessment final</p>
        <h1 className="font-course-display text-4xl font-medium leading-[1.05] tracking-tight text-[color:var(--course-ink)] sm:text-5xl">
          {assessment.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--course-ink-soft)]">
          {assessment.description}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-course-mono text-[11px] uppercase tracking-wider text-[color:var(--course-ink-mute)]">
          <span>{questions.length} preguntas</span>
          <span className="h-2 w-px bg-[color:var(--course-border-strong)]" />
          <span>{assessment.passingScore}% para aprobar</span>
          <span className="h-2 w-px bg-[color:var(--course-border-strong)]" />
          <span>Scoring instantáneo</span>
        </div>
      </header>

      {/* ─── Preguntas ─── */}
      <ol className="space-y-6">
        {questions.map((q, idx) => {
          const chosen = answers[q.id];
          const qResult = result?.byQuestion[q.id];

          return (
            <li
              key={q.id}
              id={`q-${idx + 1}`}
              className={cn(
                "rounded-lg border p-6 transition-colors duration-200",
                "border-[color:var(--course-border)]",
                "bg-[color:var(--course-surface)]/50",
                qResult?.isCorrect && "border-emerald-500/30 bg-emerald-500/[0.04]",
                qResult && !qResult.isCorrect && "border-amber-500/30 bg-amber-500/[0.04]",
              )}
            >
              <div className="mb-5 flex items-baseline gap-3">
                <span
                  className={cn(
                    "font-course-mono text-[11px] font-semibold uppercase tracking-wider",
                    "text-[color:var(--course-accent)]",
                  )}
                >
                  Q{String(idx + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-medium leading-relaxed text-[color:var(--course-ink)]">
                  {q.prompt}
                </span>
              </div>

              <fieldset className="space-y-2" disabled={!!result || submitting}>
                <legend className="sr-only">
                  Opciones para la pregunta {idx + 1}
                </legend>
                {q.options.map((opt) => {
                  const isChosen = chosen === opt.letter;
                  const showCorrect =
                    qResult && opt.letter === qResult.correctLetter;
                  const showWrong = qResult && isChosen && !qResult.isCorrect;

                  return (
                    <label
                      key={opt.letter}
                      className={cn(
                        "group flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3",
                        "transition-colors duration-150",
                        "border-[color:var(--course-border)]",
                        !result && "hover:border-[color:var(--course-accent)]/40",
                        isChosen && !result && [
                          "border-[color:var(--course-accent)]/60",
                          "bg-[color:var(--course-accent-soft)]",
                        ],
                        showCorrect && [
                          "border-emerald-500/50",
                          "bg-emerald-500/[0.06]",
                        ],
                        showWrong && [
                          "border-amber-500/60",
                          "bg-amber-500/[0.06]",
                        ],
                        result && "cursor-default",
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.letter}
                        checked={isChosen}
                        onChange={() => handleSelect(q.id, opt.letter)}
                        className="mt-1 size-4 accent-[color:var(--course-accent)]"
                      />
                      <span className="flex-1 text-[15px] leading-relaxed text-[color:var(--course-ink)]">
                        <span className="mr-2 font-course-mono text-xs uppercase text-[color:var(--course-ink-mute)]">
                          {opt.letter})
                        </span>
                        {opt.text}
                      </span>
                      {showCorrect && (
                        <Check
                          className="mt-1 size-4 shrink-0 text-emerald-500 dark:text-emerald-400"
                          aria-hidden
                          strokeWidth={2.5}
                        />
                      )}
                      {showWrong && (
                        <X
                          className="mt-1 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                          aria-hidden
                          strokeWidth={2.5}
                        />
                      )}
                    </label>
                  );
                })}
              </fieldset>

              {qResult && (
                <div
                  className={cn(
                    "mt-5 rounded-md border p-4 text-sm leading-relaxed",
                    "border-[color:var(--course-border)]",
                    "bg-[color:var(--course-bg)]",
                  )}
                >
                  <p className="course-kicker mb-2">Explicación</p>
                  <p className="text-[color:var(--course-ink-soft)]">
                    {qResult.explanation}
                  </p>
                  {(() => {
                    const sourceStep = course.steps.find(
                      (s) => s.step === q.sourceStep,
                    );
                    if (!sourceStep) return null;
                    return (
                      <Link
                        href={course.getStepUrl(sourceStep.slug, "es")}
                        className={cn(
                          "no-course-style group mt-3 inline-flex items-center gap-1.5",
                          "font-course-mono text-[11px] font-semibold uppercase tracking-wider",
                          "text-[color:var(--course-accent)]",
                          "transition-colors hover:text-[color:var(--course-accent-deep)]",
                        )}
                      >
                        Revisar paso {q.sourceStep} — {sourceStep.title}
                        <ArrowRight
                          className="size-3 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                          strokeWidth={2.5}
                        />
                      </Link>
                    );
                  })()}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* ─── Footer: progress + submit / result ─── */}
      {!result ? (
        <div
          className={cn(
            "sticky bottom-4 mt-10 rounded-lg border p-4",
            "border-[color:var(--course-border-strong)]",
            "bg-[color:var(--course-surface)]/95 backdrop-blur-md",
            "shadow-[0_8px_30px_-8px_rgba(0,0,0,0.4)]",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mini progress bar */}
              <div className="relative h-[3px] w-32 overflow-hidden rounded-full bg-[color:var(--course-border-strong)]">
                <div
                  className="absolute inset-y-0 left-0 bg-[color:var(--course-accent)] transition-all duration-300"
                  style={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                  }}
                />
              </div>
              <p className="font-course-mono text-xs tabular-nums text-[color:var(--course-ink-soft)]">
                <span className="text-[color:var(--course-ink)]">
                  {answeredCount}
                </span>
                /{questions.length}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full",
                "bg-[color:var(--course-accent)] px-5 py-2.5",
                "font-course-mono text-xs font-semibold uppercase tracking-wider text-white",
                "transition-all duration-200",
                "hover:translate-y-[-1px] hover:bg-[color:var(--course-accent-deep)]",
                "disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed",
                "shadow-[0_4px_20px_-4px_rgba(232,115,78,0.4)]",
              )}
            >
              {submitting ? "Calculando" : "Enviar"}
              {!submitting && (
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                  strokeWidth={2.5}
                />
              )}
            </button>
          </div>
        </div>
      ) : (
        <AssessmentResultPanel result={result} onRetry={handleRetry} />
      )}
    </div>
  );
}

// ─── Panel de resultado ───

interface ResultPanelProps {
  result: AssessmentResult;
  onRetry: () => void;
}

function AssessmentResultPanel({ result, onRetry }: ResultPanelProps) {
  const course = useCourseConfig();
  const { passed, score, correctCount, totalCount } = result;

  return (
    <section
      id="assessment-result"
      className={cn(
        "mt-12 rounded-lg border p-8",
        "border-[color:var(--course-border-strong)]",
        passed
          ? "bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-transparent"
          : "bg-gradient-to-br from-amber-500/[0.06] via-transparent to-transparent",
      )}
    >
      <p
        className={cn(
          "course-kicker mb-3",
          passed
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-amber-600 dark:text-amber-400",
        )}
      >
        {passed ? "Aprobado" : "Casi"}
      </p>
      <h2 className="font-course-display text-4xl font-medium leading-[1.1] tracking-tight text-[color:var(--course-ink)]">
        {correctCount} / {totalCount}{" "}
        <span className="font-course-mono text-2xl font-semibold tabular-nums text-[color:var(--course-accent)]">
          {score}%
        </span>
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[color:var(--course-ink-soft)]">
        {passed
          ? "Tienes un manejo sólido de los conceptos del curso. Puedes reclamar tu certificado de graduación ahora."
          : "Revisa las explicaciones de arriba y los pasos que fallaste. Cuando tengas ganas, puedes repetir el assessment."}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {passed ? (
          <Link
            href={`/learn/${course.courseSlug}/graduate`}
            className={cn(
              "no-course-style group inline-flex items-center gap-2 rounded-full",
              "bg-[color:var(--course-accent)] px-5 py-2.5",
              "font-course-mono text-xs font-semibold uppercase tracking-wider text-white",
              "transition-all duration-200",
              "hover:translate-y-[-1px] hover:bg-[color:var(--course-accent-deep)]",
              "shadow-[0_4px_20px_-4px_rgba(232,115,78,0.4)]",
            )}
          >
            Reclamar certificado
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
              strokeWidth={2.5}
            />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full",
              "border border-[color:var(--course-border-strong)]",
              "bg-[color:var(--course-surface)] px-5 py-2.5",
              "font-course-mono text-xs font-semibold uppercase tracking-wider",
              "text-[color:var(--course-ink)]",
              "transition-colors hover:border-[color:var(--course-accent)]/40",
            )}
          >
            <RotateCcw className="size-3.5" aria-hidden strokeWidth={2.5} />
            Intentar otra vez
          </button>
        )}
        <Link
          href={course.getCourseBaseUrl("es")}
          className={cn(
            "no-course-style inline-flex items-center gap-2 rounded-full",
            "border border-[color:var(--course-border)] px-5 py-2.5",
            "font-course-mono text-xs font-semibold uppercase tracking-wider",
            "text-[color:var(--course-ink-soft)]",
            "transition-colors hover:text-[color:var(--course-ink)]",
          )}
        >
          Volver al índice
        </Link>
      </div>
    </section>
  );
}
