// ─── Rust Embedded from Zero — Sidebar editorial de pasos ───
//
// Server component. Cada paso se renderiza como una "file row" estilo IDE:
// número mono `01–09`, título en sans, indicator de status, accent-line
// izquierda para el paso activo.

import { Check, Circle, CircleDot } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type {
  BaseStepMeta,
  CourseConfig,
  Locale,
} from "@/lib/course-config/types";

export type StepStatus = "completed" | "current" | "pending";

interface CourseSidebarProps {
  /** Config del curso. */
  course: CourseConfig;
  /** Slug ES canónico del paso actual. */
  currentSlug?: string;
  statusBySlug?: Partial<Record<string, StepStatus>>;
  className?: string;
  locale?: Locale;
}

function deriveStatus(
  step: BaseStepMeta,
  currentSlug: string | undefined,
  override: StepStatus | undefined,
  steps: readonly BaseStepMeta[],
): StepStatus {
  if (override) return override;
  if (!currentSlug) return "pending";
  if (step.slug === currentSlug) return "current";

  const currentStepNumber = steps.find((s) => s.slug === currentSlug)?.step;
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
  course,
  currentSlug,
  statusBySlug,
  className,
  locale = "es",
}: CourseSidebarProps) {
  const strings = course.t(locale);

  // Calcular progreso para el pequeño indicator del header
  const completedCount = course.steps.filter((s) => {
    const status = deriveStatus(s, currentSlug, statusBySlug?.[s.slug], course.steps);
    return status === "completed";
  }).length;
  const progressPct = Math.round((completedCount / course.totalSteps) * 100);

  return (
    <nav
      aria-label={strings.sidebarAriaLabel}
      className={cn("relative", className)}
    >
      {/* Header del sidebar */}
      <div className="mb-8 pb-6 border-b border-[color:var(--course-border)]">
        <p className="course-kicker mb-2">{strings.courseLabel}</p>
        <p className="font-course-display text-lg font-medium leading-tight text-[color:var(--course-ink)] tracking-tight">
          {course.courseTitles[locale]}
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
            {completedCount}
            {strings.progressSeparator}
            {course.totalSteps}
          </span>
        </div>
      </div>

      {/* Lista de pasos */}
      <ol className="space-y-0">
        {course.steps.map((step) => {
          const status = deriveStatus(
            step,
            currentSlug,
            statusBySlug?.[step.slug],
            course.steps,
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
                href={course.getStepUrl(step.slug, locale)}
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
                  {course.getStepTitle(step, locale)}
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
