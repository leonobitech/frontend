"use client";

// ─── Course Config — React Context Provider (client) ───
//
// El provider recibe sólo `courseSlug` (string serializable) como prop, y
// resuelve internamente el `CourseConfig` completo desde un registry local.
// Esto permite que un server component padre (CourseStepView, AssessmentForm)
// envuelva su árbol con el provider sin necesidad de serializar las funciones
// del config a través de la server/client boundary.
//
// Los server components que necesitan acceso al config reciben `course` por
// prop directo (server→server, sin serialización). Los client components
// dentro del árbol leen `useCourseConfig()` del context.

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { financebenchConfig } from "./configs/financebench";
import { rustConfig } from "./configs/rust";
import type { CourseConfig } from "./types";

const REGISTRY: Record<string, CourseConfig> = {
  [rustConfig.courseSlug]: rustConfig,
  [financebenchConfig.courseSlug]: financebenchConfig,
};

const CourseConfigContext = createContext<CourseConfig | null>(null);

interface CourseConfigProviderProps {
  /** Slug ES canónico del curso. */
  courseSlug: string;
  children: ReactNode;
}

export function CourseConfigProvider({
  courseSlug,
  children,
}: CourseConfigProviderProps) {
  const course = useMemo(() => {
    const config = REGISTRY[courseSlug];
    if (!config) {
      throw new Error(
        `<CourseConfigProvider>: courseSlug "${courseSlug}" no está registrado. ` +
          `Configs disponibles: ${Object.keys(REGISTRY).join(", ")}.`,
      );
    }
    return config;
  }, [courseSlug]);

  return (
    <CourseConfigContext.Provider value={course}>
      {children}
    </CourseConfigContext.Provider>
  );
}

export function useCourseConfig(): CourseConfig {
  const ctx = useContext(CourseConfigContext);
  if (!ctx) {
    throw new Error(
      "useCourseConfig() debe usarse dentro de un <CourseConfigProvider>. " +
        "Asegurate de que el component top-level (CourseStepView, AssessmentForm) " +
        "esté envolviendo el árbol con el provider.",
    );
  }
  return ctx;
}
