// ─── Rust Embedded from Zero — Layout EN ───
//
// Provee `<CourseConfigProvider>` para que los components shared del curso
// (TOC, ScrollToTop, CompleteButton, AssessmentForm) puedan leer el config
// vía `useCourseConfig()`.

import type { ReactNode } from "react";

import { rustConfig } from "@/lib/course-config/configs/rust";
import { CourseConfigProvider } from "@/lib/course-config/context";

interface Props {
  children: ReactNode;
}

export default function RustCourseLayoutEn({ children }: Props) {
  return (
    <CourseConfigProvider courseSlug={rustConfig.courseSlug}>
      {children}
    </CourseConfigProvider>
  );
}
