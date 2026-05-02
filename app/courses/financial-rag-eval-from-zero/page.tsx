// ─── Financial RAG Evaluation Suite — Landing del curso (ES) ───
//
// Bootstrap landing. La versión completa (hero editorial, índice de lessons,
// horizon, CTAs) se crece a medida que lleguen las lessons via Trigger A.
//
// Por ahora muestra: hero corto + Stages como agrupación visual + lista de
// lessons placeholders + nota "Coming soon". Esta página NO usa
// `<CourseLandingView>` (acoplado a `lib/course/` rust-embedded) —
// renderiza directo desde `lib/course-financebench/`.
//
// Cuando tengamos ≥1 lesson publicada, este archivo absorbe el patrón de
// `CourseLandingView` (o lo refactorizamos para que sea parametric).

import type { Metadata } from "next";

import { FinancebenchLandingView } from "@/components/course/FinancebenchLandingView";
import {
  COURSE_STEPS,
  COURSE_TITLES,
  COURSE_TOTAL_STEPS,
} from "@/lib/course-financebench/steps";
import { hasStepMdx } from "@/lib/course-financebench/load-step";
const COURSE_DESCRIPTION =
  "Curso gratis de evaluación rigurosa de RAG sobre dominio financiero (FinanceBench + FinMTEB). Stages editoriales para ir de no haber medido nunca un sistema RAG a una suite reproducible paper-quality con 5 embedders × 4 chunking × 6 métricas y bootstrap CIs.";
const COURSE_URL = "/courses/financial-rag-eval-from-zero";
const COURSE_URL_EN = "/en/courses/financial-rag-eval-from-zero";
const COURSE_OG_IMAGE = "/opengraph-course-rust-embedded.png"; // TODO: imagen propia para financebench

export const metadata: Metadata = {
  title: `${COURSE_TITLES.es} — Curso gratuito de RAG eval | Leonobitech`,
  description: COURSE_DESCRIPTION,
  keywords: [
    "Financial RAG",
    "FinanceBench",
    "FinMTEB",
    "embeddings evaluation",
    "BGE-M3",
    "fine-tuning embeddings",
    "Contextual Retrieval",
    "Late Chunking",
    "Recall@k",
    "bootstrap CIs",
    "PyTorch",
    "HuggingFace",
    "curso RAG español",
    "Leonobitech",
  ],
  alternates: {
    canonical: COURSE_URL,
    languages: {
      es: COURSE_URL,
      en: COURSE_URL_EN,
      "x-default": COURSE_URL,
    },
  },
  openGraph: {
    title: COURSE_TITLES.es,
    description: COURSE_DESCRIPTION,
    type: "article",
    url: COURSE_URL,
    locale: "es_ES",
    alternateLocale: ["en_US"],
    siteName: "Leonobitech",
    images: [
      {
        url: COURSE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Financial RAG Evaluation Suite — Curso gratuito",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: COURSE_TITLES.es,
    description: COURSE_DESCRIPTION,
    images: [COURSE_OG_IMAGE],
  },
};

const COURSE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: COURSE_TITLES.es,
  description: COURSE_DESCRIPTION,
  url: `https://www.leonobitech.com${COURSE_URL}`,
  inLanguage: "es",
  isAccessibleForFree: true,
  educationalLevel: "Intermediate",
  about: [
    "Retrieval-Augmented Generation",
    "Embeddings evaluation",
    "FinanceBench",
    "FinMTEB",
    "Fine-tuning",
    "Contextual Retrieval",
    "Late Chunking",
  ],
  provider: {
    "@type": "Organization",
    name: "Leonobitech",
    url: "https://www.leonobitech.com",
    logo: "https://www.leonobitech.com/opengraph-image.png",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    category: "Free",
  },
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "Online",
    inLanguage: "es",
  },
  numberOfCredits: COURSE_TOTAL_STEPS,
  image: [`https://www.leonobitech.com${COURSE_OG_IMAGE}`],
};

export default async function FinancebenchCourseLandingPage() {
  const courseJsonLd = JSON.stringify(COURSE_JSON_LD);
  // Marcar qué lessons ya tienen MDX publicado (Trigger A ejecutado).
  const publishedSet = new Set<string>();
  await Promise.all(
    COURSE_STEPS.map(async (step) => {
      if (await hasStepMdx(step.slug, "es")) publishedSet.add(step.slug);
    }),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: courseJsonLd }}
      />
      <FinancebenchLandingView
        locale="es"
        publishedSlugs={Array.from(publishedSet)}
      />
    </>
  );
}
