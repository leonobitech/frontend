// ─── Rust Embedded from Zero — UI strings bilingües (ES / EN) ───
//
// Fuente única de verdad para textos visibles del curso. Cualquier string que
// se muestre en sidebar, TOC, botones, footer o metadata vive acá.
//
// Convención: `t(locale).key` desde server components, `useT(locale).key`
// desde client si hace falta — pero como esto es solo lookup, exportamos
// `t()` puro (sin React context). El locale viene del segmento de la URL,
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
  heroLine1: "Rust Embedded",
  heroLine2: "desde Cero",
  heroLead: (highlight) =>
    `Nueve pasos para ir de ${highlight} a tener un firmware IoT corriendo en un ESP32-C3. Cada paso transforma el código del anterior — no es cortar y pegar de un proyecto terminado, es un arco donde aprendes mientras el firmware crece.`,
  heroLeadHighlight: "no sé Rust ni embedded",
  ctaStartFirst: "Empezar por el Paso 01",
  metaSteps: (n) => `${n} pasos`,
  metaBoard: "ESP32-C3",
  metaStack: "Rust + ESP-IDF",
  metaLanguage: "Español",
  forYouIfKicker: "Para ti si",
  forYouIfBody:
    "Ya programas en algún lenguaje pero nunca tocaste Rust ni sistemas embedded.",
  willUnderstandKicker: "Vas a entender",
  willUnderstandBody: (why, how) =>
    `El ${why} de cada decisión, no solo el ${how}. Ownership, RAII, WiFi provisioning, WebSocket, watchdog.`,
  whyWord: "por qué",
  howWord: "cómo",
  requirementsKicker: "Requisitos",
  requirementsBody:
    "Una placa ESP32-C3-DevKit-RUST-1 (opcional — el código compila sin ella). Terminal y ganas.",
  indexKicker: "Índice",
  indexTitle: "Los",
  indexHighlight: "9 pasos",
  horizonKicker: "El horizonte",
  horizonBody: (win) =>
    `Al terminar el paso 9 tienes un firmware IoT con WiFi + WebSocket + schedule + watchdog que habla con un backend y ${win}. Todo construido paso a paso, sin atajos.`,
  horizonWin: "no se cuelga en producción",
  assessmentKicker: "Assessment final",
  assessmentBody:
    "9 preguntas meta-integradoras. Aprobando con 70% o más, reclamas tu certificado de graduación.",
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
  heroLine1: "Rust Embedded",
  heroLine2: "from Zero",
  heroLead: (highlight) =>
    `Nine steps to go from ${highlight} to running an IoT firmware on an ESP32-C3. Each step transforms the code of the previous one — it's not copy-paste from a finished project, it's an arc where you learn while the firmware grows.`,
  heroLeadHighlight: "I don't know Rust or embedded",
  ctaStartFirst: "Start with Step 01",
  metaSteps: (n) => `${n} steps`,
  metaBoard: "ESP32-C3",
  metaStack: "Rust + ESP-IDF",
  metaLanguage: "English",
  forYouIfKicker: "This is for you if",
  forYouIfBody:
    "You already program in some language but you've never touched Rust or embedded systems.",
  willUnderstandKicker: "You'll understand",
  willUnderstandBody: (why, how) =>
    `The ${why} behind every decision, not just the ${how}. Ownership, RAII, WiFi provisioning, WebSocket, watchdog.`,
  whyWord: "why",
  howWord: "how",
  requirementsKicker: "Requirements",
  requirementsBody:
    "An ESP32-C3-DevKit-RUST-1 board (optional — the code compiles without it). A terminal and the will.",
  indexKicker: "Index",
  indexTitle: "The",
  indexHighlight: "9 steps",
  horizonKicker: "The horizon",
  horizonBody: (win) =>
    `By the time you finish step 9 you'll have an IoT firmware with WiFi + WebSocket + schedule + watchdog that talks to a backend and ${win}. All built step by step, no shortcuts.`,
  horizonWin: "doesn't crash in production",
  assessmentKicker: "Final assessment",
  assessmentBody:
    "9 meta-integrating questions. Pass with 70% or more and claim your graduation certificate.",
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
