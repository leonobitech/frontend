// ─── Rust Embedded desde Cero — Botón "Marcar como completada" ───
//
// Client component. Al montar, resuelve el `lessonId` del paso actual
// consultando `fetchCourseStructure()` (que lee `/api/learn/courses/:slug`).
// Si el lesson existe y el user está enrolled, habilita el botón.
//
// Estados:
//   - loading:   fetch inicial en curso
//   - pending:   lesson cargada, no completada — botón activo
//   - completing: POST en vuelo
//   - completed: marcada — muestra badge sin acción
//   - unavailable: sin lesson / sin enrollment / error de red — oculto
//
// Degradación: si el LMS no tiene la lesson seedeada o el user no está
// enrolled, el botón NO se muestra (return null). El course sigue siendo
// leíble — solo se pierde la feature de progress tracking.

"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  fetchCourseStructure,
  markLessonComplete,
} from "@/lib/api/course-progress";
import { useCourseConfig } from "@/lib/course-config/context";
import type { Locale } from "@/lib/course-config/types";
import { cn } from "@/lib/utils";

type State =
  | "loading"
  | "pending"
  | "completing"
  | "completed"
  | "unavailable";

interface CompleteButtonProps {
  /** Slug ES canónico — la API del LMS solo conoce slugs ES. */
  stepSlug: string;
  className?: string;
  locale?: Locale;
}

export function CompleteButton({ stepSlug, className, locale = "es" }: CompleteButtonProps) {
  const { t, courseSlug } = useCourseConfig();
  const strings = t(locale);
  const [state, setState] = useState<State>("loading");
  const [lessonId, setLessonId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchCourseStructure(courseSlug).then((structure) => {
      if (cancelled) return;

      if (!structure) {
        setState("unavailable");
        return;
      }

      const lesson = structure.lessonsBySlug[stepSlug];
      if (!lesson) {
        // Lesson no seedeada para este slug
        setState("unavailable");
        return;
      }

      setLessonId(lesson.id);
      setState(lesson.completed ? "completed" : "pending");
    });

    return () => {
      cancelled = true;
    };
  }, [stepSlug, courseSlug]);

  async function handleClick(): Promise<void> {
    if (!lessonId || state !== "pending") return;
    setState("completing");
    const ok = await markLessonComplete(lessonId);
    setState(ok ? "completed" : "pending");
  }

  // Estados silenciosos: no renderizamos nada mientras carga o si no hay
  // lesson — evitamos layout shift y ruido visual.
  if (state === "loading" || state === "unavailable") {
    return null;
  }

  if (state === "completed") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full",
          "border border-[color:var(--course-accent)]/30",
          "bg-[color:var(--course-accent-soft)]",
          "px-4 py-2 font-course-mono text-xs font-semibold",
          "text-[color:var(--course-accent)]",
          className,
        )}
        aria-label={strings.completedAria}
      >
        <Check className="size-3.5" aria-hidden strokeWidth={2.5} />
        <span className="tracking-wide uppercase">{strings.completed}</span>
      </div>
    );
  }

  const isWorking = state === "completing";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isWorking}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full",
        "bg-[color:var(--course-accent)] px-5 py-2.5",
        "font-course-mono text-xs font-semibold uppercase tracking-wider text-white",
        "transition-all duration-200",
        "hover:bg-[color:var(--course-accent)]/90 hover:translate-y-[-1px]",
        "disabled:opacity-60 disabled:translate-y-0",
        "shadow-[0_4px_20px_-4px_rgba(232,115,78,0.4)]",
        className,
      )}
    >
      {isWorking ? (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden strokeWidth={2.5} />
          {strings.marking}
        </>
      ) : (
        <>
          <Check className="size-3.5" aria-hidden strokeWidth={2.5} />
          {strings.markComplete}
        </>
      )}
    </button>
  );
}
