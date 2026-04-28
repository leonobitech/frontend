// ─── Course Config — Financial RAG Evaluation Suite ───
//
// Adapter del lib/course-financebench/ al contrato CourseConfig. Las pages
// `app/courses/financial-rag-eval-from-zero/...` lo pasan como prop a los
// components shared para activar el curso.

import { t } from "@/lib/course-financebench/i18n";
import {
  getCourseBaseUrl,
  getStepUrl,
  localizeStepSlug,
} from "@/lib/course-financebench/routing";
import {
  COURSE_SLUG,
  COURSE_STEPS,
  COURSE_TITLES,
  COURSE_TOTAL_STEPS,
  getAdjacentSteps,
  getStepBySlug,
  getStepTitle,
  type StepMeta as FbStepMeta,
} from "@/lib/course-financebench/steps";

import type { BaseStepMeta, CourseConfig } from "@/lib/course-config/types";

// Wrappers que aceptan BaseStepMeta. El StepMeta de financebench extiende
// BaseStepMeta con `stage`, pero las funciones internas no usan `stage`,
// así que el cast es seguro.
const wrappedGetStepTitle: CourseConfig["getStepTitle"] = (step, locale) =>
  getStepTitle(step as FbStepMeta, locale);

export const financebenchConfig: CourseConfig = {
  courseSlug: COURSE_SLUG,
  courseTitles: COURSE_TITLES,
  steps: COURSE_STEPS satisfies readonly BaseStepMeta[],
  totalSteps: COURSE_TOTAL_STEPS,
  t,
  getCourseBaseUrl,
  getStepUrl,
  localizeStepSlug,
  getStepBySlug,
  getStepTitle: wrappedGetStepTitle,
  getAdjacentSteps,
  lmsApiBase: "/api/learn/courses",
  ogImagePath: "/opengraph-course-rust-embedded.png", // TODO: imagen propia financebench
};
