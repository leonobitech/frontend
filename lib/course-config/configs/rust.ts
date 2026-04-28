// ─── Course Config — Rust Embedded from Zero ───
//
// Adapter del lib/course/ (rust-embedded) al contrato CourseConfig. Las pages
// `app/courses/rust-embedded-desde-cero/...` lo pasan como prop a los components
// shared para activar el curso.

import { t } from "@/lib/course/i18n";
import {
  getCourseBaseUrl,
  getStepUrl,
  localizeStepSlug,
} from "@/lib/course/routing";
import {
  COURSE_SLUG,
  COURSE_STEPS,
  COURSE_TITLES,
  COURSE_TOTAL_STEPS,
  getAdjacentSteps,
  getStepBySlug,
  getStepTitle,
} from "@/lib/course/steps";

import type { CourseConfig } from "@/lib/course-config/types";

export const rustConfig: CourseConfig = {
  courseSlug: COURSE_SLUG,
  courseTitles: COURSE_TITLES,
  steps: COURSE_STEPS,
  totalSteps: COURSE_TOTAL_STEPS,
  t,
  getCourseBaseUrl,
  getStepUrl,
  localizeStepSlug,
  getStepBySlug,
  getStepTitle,
  getAdjacentSteps,
  lmsApiBase: "/api/learn/courses",
  ogImagePath: "/opengraph-course-rust-embedded.png",
};
