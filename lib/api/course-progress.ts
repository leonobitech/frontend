// ─── Rust Embedded desde Cero — Cliente API para progress + enrollment ───
//
// Wrappers alrededor de los endpoints del LMS existentes, con tipado + error
// handling graceful. Todas las funciones devuelven `null`/`false` en error
// para que la UI se degrade suavemente (ej. si el user no está enrolled, no
// rompemos la página, solo ocultamos el botón de complete).
//
// Endpoints usados:
//   GET  /api/learn/courses/:slug              → course structure + lessons
//   POST /api/learn/lessons/:lessonId/complete → marca lesson completada
//   POST /api/courses/rust-embedded/enroll     → auto-enroll (proxy custom)

import { COURSE_SLUG } from "@/lib/course/steps";

export interface LessonSummary {
  id: string;
  slug: string;
  completed: boolean;
}

export interface CourseStructure {
  course: { id: string; slug: string; title: string };
  /** Map de slug → lesson (permite resolver lessonId dado el slug de la URL). */
  lessonsBySlug: Record<string, LessonSummary>;
}

/**
 * Fetch de la estructura del curso (course + modules + lessons con completed flag).
 * Retorna `null` si el user no está autenticado, no está enrolled, o el course
 * no existe en DB (falta correr el seed script).
 */
export async function fetchCourseStructure(): Promise<CourseStructure | null> {
  try {
    const res = await fetch(`/api/learn/courses/${COURSE_SLUG}`, {
      credentials: "include",
    });
    if (!res.ok) return null;

    const payload = await res.json();
    // El handler del LMS wrap en { data: {...} } según convención del backend.
    const data = payload.data ?? payload;

    const lessonsBySlug: Record<string, LessonSummary> = {};
    for (const mod of data.modules ?? []) {
      for (const lesson of mod.lessons ?? []) {
        lessonsBySlug[lesson.slug] = {
          id: lesson.id,
          slug: lesson.slug,
          completed: Boolean(lesson.completed),
        };
      }
    }

    if (Object.keys(lessonsBySlug).length === 0) {
      // Course existe pero sin lessons — fase de seed incompleta
      return null;
    }

    return {
      course: { id: data.id, slug: data.slug, title: data.title },
      lessonsBySlug,
    };
  } catch {
    return null;
  }
}

/**
 * Marca una lesson como completada. Idempotente en el backend.
 * Requiere que el user esté enrolled en el course.
 */
export async function markLessonComplete(lessonId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/learn/lessons/${lessonId}/complete`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Auto-enroll del user actual al curso Rust. Idempotente:
 *   - 200/201: enroll creado
 *   - 409: ya está enrolled (OK)
 *   - 4xx/5xx: error (retornamos false, el caller decide qué hacer)
 */
export async function enrollInRustCourse(): Promise<boolean> {
  try {
    const res = await fetch(`/api/courses/rust-embedded/enroll`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok || res.status === 409;
  } catch {
    return false;
  }
}
