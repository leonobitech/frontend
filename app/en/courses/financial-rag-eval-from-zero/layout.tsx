// ─── Financial RAG Evaluation Suite — Layout EN ───
//
// Provee `<CourseConfigProvider>` para que los components shared del curso
// puedan leer el config vía `useCourseConfig()`. Sin auth gate — el curso
// es gratuito.

import type { ReactNode } from "react";

import { financebenchConfig } from "@/lib/course-config/configs/financebench";
import { CourseConfigProvider } from "@/lib/course-config/context";

interface Props {
  children: ReactNode;
}

export default function FinancebenchCourseLayoutEn({ children }: Props) {
  return (
    <CourseConfigProvider courseSlug={financebenchConfig.courseSlug}>
      {children}
    </CourseConfigProvider>
  );
}
