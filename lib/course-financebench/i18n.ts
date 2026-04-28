// ─── Financial RAG Evaluation Suite — UI strings bilingües (ES / EN) ───
//
// Fuente única de verdad para textos visibles del curso. Mismo contrato que
// `lib/course/i18n.ts` — clonado y adaptado al dominio financebench (5 Stages,
// 19 lessons aprox, dominio RAG / financial evaluation).
//
// Convención: `t(locale).key` desde server components, `useT(locale).key`
// desde client si hace falta. El locale viene del segmento de la URL,
// no de cookie ni Accept-Language.

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

export interface CourseStrings {
  // Etiqueta corta de identidad — "Course" / "Curso"
  courseLabel: string;
  // Pie del progress en sidebar — "{n}/{total}"
  progressSeparator: string;
  // Nav: aria-label, prev/next labels, "completar"
  sidebarAriaLabel: string;
  stepNavAriaLabel: string;
  prev: string;
  next: string;
  // CompleteButton states
  markComplete: string;
  marking: string;
  completed: string;
  completedAria: string;
  // Step hero kicker — "Paso {n} / {total}" / "Step {n} / {total}"
  stepKicker: (n: number, total: number) => string;
  // TOC
  tocKicker: string;
  tocAriaLabel: string;
  // Volver arriba
  scrollTopAria: string;
  // Landing del curso
  freeCourseEyebrow: string;
  heroLine1: string;
  heroLine2: string;
  heroLead: (firstHighlight: string) => string;
  heroLeadHighlight: string;
  ctaStartFirst: string;
  metaSteps: (n: number) => string;
  metaBoard: string;
  metaStack: string;
  metaLanguage: string;
  forYouIfKicker: string;
  forYouIfBody: string;
  willUnderstandKicker: string;
  willUnderstandBody: (whyEmphasis: string, howEmphasis: string) => string;
  whyWord: string;
  howWord: string;
  requirementsKicker: string;
  requirementsBody: string;
  indexKicker: string;
  indexTitle: string;
  indexHighlight: string;
  horizonKicker: string;
  horizonBody: (winEmphasis: string) => string;
  horizonWin: string;
  assessmentKicker: string;
  assessmentBody: string;
  assessmentCta: string;
  // Banner que aparece en steps EN cuando el MDX todavía no está traducido
  translationInProgressBanner: string;
  translationInProgressLink: string;
  // Card del repositorio de GitHub que va arriba del contenido de cada paso
  repoCardLabel: string;
  repoCardCta: string;
  // Locale switcher
  switchToOtherLocale: string;
  otherLocaleLabel: string;
  thisLocaleLabel: string;
}

const ES: CourseStrings = {
  courseLabel: "Curso",
  progressSeparator: "/",
  sidebarAriaLabel: "Pasos del curso",
  stepNavAriaLabel: "Navegación entre pasos",
  prev: "Anterior",
  next: "Siguiente",
  markComplete: "Marcar completada",
  marking: "Marcando",
  completed: "Completado",
  completedAria: "Paso completado",
  stepKicker: (n, total) =>
    `Paso ${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
  tocKicker: "En este paso",
  tocAriaLabel: "Índice del paso",
  scrollTopAria: "Volver arriba",
  freeCourseEyebrow: "Curso gratuito · 2026",
  heroLine1: "Financial RAG Evaluation Suite",
  heroLine2: "from Zero",
  heroLead: (highlight) =>
    `Un arco de Stages para ir de ${highlight} a una suite de evaluación rigurosa de RAG sobre dominio financiero. Cada Stage transforma el repo del anterior — embeddings, retrieval, fine-tuning, failure mode analysis — hasta cerrar en un activo paper-quality publicable.`,
  heroLeadHighlight: "no medí un sistema RAG en mi vida",
  ctaStartFirst: "Empezar por el Paso 01",
  metaSteps: (n) => `${n} pasos`,
  metaBoard: "FinanceBench + FinMTEB",
  metaStack: "PyTorch + HuggingFace",
  metaLanguage: "Español",
  forYouIfKicker: "Para ti si",
  forYouIfBody:
    "Programás en Python y entendés ML básico, pero nunca evaluaste rigurosamente un sistema RAG ni hiciste fine-tuning de embeddings.",
  willUnderstandKicker: "Vas a entender",
  willUnderstandBody: (why, how) =>
    `El ${why} de cada decisión, no solo el ${how}. Embeddings, retrieval evaluation con bootstrap CIs, contextual retrieval, late chunking, fine-tuning, failure modes.`,
  whyWord: "por qué",
  howWord: "cómo",
  requirementsKicker: "Requisitos",
  requirementsBody:
    "Python intermedio + curiosidad por papers. Mac con Apple Silicon o GPU NVIDIA recomendado, pero el código corre en CPU. Presupuesto ~$40-50 USD para APIs.",
  indexKicker: "Índice",
  indexTitle: "Los",
  indexHighlight: "Stages",
  horizonKicker: "El horizonte",
  horizonBody: (win) =>
    `Al cerrar el Stage 4 tenés una suite reproducible con tabla maestra (5 embedders × 4 chunking × 6 métricas con bootstrap CIs), un BGE-M3 fine-tuned publicado en HF Hub, y ${win}. Todo construido Stage por Stage, sin atajos.`,
  horizonWin: "un activo defendible en una entrevista de Senior AI Engineer",
  assessmentKicker: "Assessment final",
  assessmentBody:
    "Preguntas meta-integradoras, una por paso. Aprobando con 70% o más, reclamas tu certificado de graduación.",
  assessmentCta: "Ir al assessment",
  translationInProgressBanner:
    "Traducción al inglés en proceso. Mostramos la versión en español mientras tanto.",
  translationInProgressLink: "Ver versión en español",
  repoCardLabel: "Código del paso",
  repoCardCta: "Ver en GitHub",
  switchToOtherLocale: "Read in English",
  otherLocaleLabel: "EN",
  thisLocaleLabel: "ES",
};

const EN: CourseStrings = {
  courseLabel: "Course",
  progressSeparator: "/",
  sidebarAriaLabel: "Course steps",
  stepNavAriaLabel: "Step navigation",
  prev: "Previous",
  next: "Next",
  markComplete: "Mark complete",
  marking: "Marking",
  completed: "Completed",
  completedAria: "Step completed",
  stepKicker: (n, total) =>
    `Step ${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
  tocKicker: "In this step",
  tocAriaLabel: "Step contents",
  scrollTopAria: "Back to top",
  freeCourseEyebrow: "Free course · 2026",
  heroLine1: "Financial RAG Evaluation Suite",
  heroLine2: "from Zero",
  heroLead: (highlight) =>
    `A Stage-driven arc to go from ${highlight} to a rigorous evaluation suite for RAG over financial documents. Each Stage transforms the repo of the previous one — embeddings, retrieval, fine-tuning, failure mode analysis — until closing on a paper-quality, publishable asset.`,
  heroLeadHighlight: "I have never measured a RAG system",
  ctaStartFirst: "Start with Step 01",
  metaSteps: (n) => `${n} steps`,
  metaBoard: "FinanceBench + FinMTEB",
  metaStack: "PyTorch + HuggingFace",
  metaLanguage: "English",
  forYouIfKicker: "This is for you if",
  forYouIfBody:
    "You program in Python and understand basic ML, but you've never rigorously evaluated a RAG system or fine-tuned embeddings.",
  willUnderstandKicker: "You'll understand",
  willUnderstandBody: (why, how) =>
    `The ${why} behind every decision, not just the ${how}. Embeddings, retrieval evaluation with bootstrap CIs, contextual retrieval, late chunking, fine-tuning, failure modes.`,
  whyWord: "why",
  howWord: "how",
  requirementsKicker: "Requirements",
  requirementsBody:
    "Intermediate Python + curiosity about papers. A Mac with Apple Silicon or an NVIDIA GPU is recommended, but the code also runs on CPU. Budget ~$40-50 USD for APIs.",
  indexKicker: "Index",
  indexTitle: "The",
  indexHighlight: "Stages",
  horizonKicker: "The horizon",
  horizonBody: (win) =>
    `By the time you close Stage 4 you'll have a reproducible suite with a master table (5 embedders × 4 chunking × 6 metrics with bootstrap CIs), a BGE-M3 fine-tuned model published on the HF Hub, and ${win}. All built Stage by Stage, no shortcuts.`,
  horizonWin: "a defensible asset for a Senior AI Engineer interview",
  assessmentKicker: "Final assessment",
  assessmentBody:
    "Meta-integrating questions, one per step. Pass with 70% or more and claim your graduation certificate.",
  assessmentCta: "Go to assessment",
  translationInProgressBanner:
    "English translation in progress. Showing the Spanish version in the meantime.",
  translationInProgressLink: "See Spanish version",
  repoCardLabel: "Step source code",
  repoCardCta: "View on GitHub",
  switchToOtherLocale: "Leer en español",
  otherLocaleLabel: "ES",
  thisLocaleLabel: "EN",
};

const STRINGS: Record<Locale, CourseStrings> = { es: ES, en: EN };

export function t(locale: Locale): CourseStrings {
  return STRINGS[locale];
}

/** OG locale tag para metadata.openGraph.locale. */
export function ogLocale(locale: Locale): string {
  return locale === "es" ? "es_ES" : "en_US";
}

/** BCP-47 lang code para schema.org y `<html lang>`. */
export function bcp47(locale: Locale): string {
  return locale === "es" ? "es" : "en";
}
