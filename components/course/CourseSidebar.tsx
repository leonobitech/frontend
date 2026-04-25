// ─── Rust Embedded desde Cero — Sidebar editorial de pasos ───
//
// Server component. Cada paso se renderiza como una "file row" estilo IDE:
// número mono `01–09`, título en sans, indicator de status, accent-line
// izquierda para el paso activo.

import { Check, Circle, CircleDot } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  COURSE_BASE_URL,
  COURSE_STEPS,
  COURSE_TITLE,
  COURSE_TOTAL_STEPS,
  type StepMeta,
} from "@/lib/course/steps";

export type StepStatus = "completed" | "current" | "pending";

interface CourseSidebarProps {
  currentSlug?: string;
  statusBySlug?: Partial<Record<string, StepStatus>>;
  className?: string;
}

function deriveStatus(
  step: StepMeta,
  currentSlug: string | undefined,
  override: StepStatus | undefined,
): StepStatus {
  if (override) return override;
  if (!currentSlug) return "pending";
  if (step.slug === currentSlug) return "current";

  const currentStepNumber = COURSE_STEPS.find(
    (s) => s.slug === currentSlug,
  )?.step;
  if (currentStepNumber !== undefined && step.step < currentStepNumber) {
    return "completed";
  }
  return "pending";
}

const STATUS_ICON = {
  completed: Check,
  current: CircleDot,
  pending: Circle,
} as const;

export function CourseSidebar({
  currentSlug,
  statusBySlug,
  className,
}: CourseSidebarProps) {
  // Calcular progreso para el pequeño indicator del header
  const completedCount = COURSE_STEPS.filter((s) => {
    const status = deriveStatus(s, currentSlug, statusBySlug?.[s.slug]);
    return status === "completed";
  }).length;
  const progressPct = Math.round((completedCount / COURSE_TOTAL_STEPS) * 100);

  return (
    <nav
      aria-label="Pasos del curso"
      className={cn("relative", className)}
    >
      {/* Header del sidebar */}
      <div className="mb-8 pb-6 border-b border-[color:var(--course-border)]">
        <p className="course-kicker mb-2">Course</p>
        <p className="font-course-display text-lg font-medium leading-tight text-[color:var(--course-ink)] tracking-tight">
          {COURSE_TITLE}
        </p>
        {/* Progress indicator minimalista */}
        <div className="mt-4 flex items-center gap-2">
          <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-[color:var(--course-border-strong)]">
            <div
              className="absolute inset-y-0 left-0 bg-[color:var(--course-accent)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-course-mono text-[10px] tabular-nums text-[color:var(--course-ink-mute)]">
            {completedCount}/{COURSE_TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Lista de pasos */}
      <ol className="space-y-0">
        {COURSE_STEPS.map((step) => {
          const status = deriveStatus(
            step,
            currentSlug,
            statusBySlug?.[step.slug],
          );
          const Icon = STATUS_ICON[status];
          const isCurrent = status === "current";
          const isCompleted = status === "completed";
          const stepPadded = String(step.step).padStart(2, "0");

          return (
            <li key={step.slug} className="relative">
              {/* Accent line izquierda para el paso activo */}
              {isCurrent && (
                <span
                  aria-hidden
                  className="absolute left-0 top-2 bottom-2 w-[2px] bg-[color:var(--course-accent)]"
                />
              )}
              <Link
                href={`${COURSE_BASE_URL}/${step.slug}`}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "group no-course-style relative flex items-start gap-3 py-2.5 pl-4 pr-2",
                  "transition-all duration-200",
                  isCurrent
                    ? "text-[color:var(--course-ink)]"
                    : "text-[color:var(--course-ink-soft)] hover:text-[color:var(--course-ink)]",
                )}
              >
                {/* Número del paso en mono */}
                <span
                  className={cn(
                    "font-course-mono text-[11px] font-semibold tabular-nums pt-0.5",
                    "transition-colors",
                    isCurrent
                      ? "text-[color:var(--course-accent)]"
                      : isCompleted
                        ? "text-[color:var(--course-ink-soft)]"
                        : "text-[color:var(--course-ink-mute)]",
                  )}
                >
                  {stepPadded}
                </span>

                {/* Título */}
                <span className="min-w-0 flex-1 text-sm leading-snug">
                  {step.title}
                </span>

                {/* Status icon */}
                <Icon
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0 transition-colors",
                    isCompleted && "text-[color:var(--course-accent)]",
                    isCurrent && "text-[color:var(--course-accent)]",
                    status === "pending" && "text-[color:var(--course-ink-mute)] opacity-50",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
