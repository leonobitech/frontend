// ─── Financial RAG Evaluation Suite — Course landing (EN) ───
//
// Bootstrap landing in English. Mirrors the ES landing structure. The full
// editorial version (hero, story, full index) grows once the first lessons
// land via Trigger A.

import type { Metadata } from "next";

import { FinancebenchLandingView } from "@/components/course/FinancebenchLandingView";
import {
  COURSE_STEPS,
  COURSE_TITLES,
  COURSE_TOTAL_STEPS,
} from "@/lib/course-financebench/steps";
import { hasStepMdx } from "@/lib/course-financebench/load-step";
const COURSE_DESCRIPTION =
  "Free course on rigorous RAG evaluation over financial documents (FinanceBench + FinMTEB). Editorial Stages to go from never having measured a RAG system to a paper-quality reproducible suite with 5 embedders × 4 chunking strategies × 6 metrics with bootstrap CIs.";
const COURSE_URL_EN = "/en/courses/financial-rag-eval-from-zero";
const COURSE_URL_ES = "/courses/financial-rag-eval-from-zero";
const COURSE_OG_IMAGE = "/opengraph-course-rust-embedded.png"; // TODO: dedicated financebench image

export const metadata: Metadata = {
  title: `${COURSE_TITLES.en} — Free RAG evaluation course | Leonobitech`,
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
    "RAG course English",
    "Leonobitech",
  ],
  alternates: {
    canonical: COURSE_URL_EN,
    languages: {
      es: COURSE_URL_ES,
      en: COURSE_URL_EN,
      "x-default": COURSE_URL_ES,
    },
  },
  openGraph: {
    title: COURSE_TITLES.en,
    description: COURSE_DESCRIPTION,
    type: "article",
    url: COURSE_URL_EN,
    locale: "en_US",
    alternateLocale: ["es_ES"],
    siteName: "Leonobitech",
    images: [
      {
        url: COURSE_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Financial RAG Evaluation Suite — Free course",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: COURSE_TITLES.en,
    description: COURSE_DESCRIPTION,
    images: [COURSE_OG_IMAGE],
  },
};

const COURSE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: COURSE_TITLES.en,
  description: COURSE_DESCRIPTION,
  url: `https://www.leonobitech.com${COURSE_URL_EN}`,
  inLanguage: "en",
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
    inLanguage: "en",
  },
  numberOfCredits: COURSE_TOTAL_STEPS,
  image: [`https://www.leonobitech.com${COURSE_OG_IMAGE}`],
};

export default async function FinancebenchCourseLandingPageEn() {
  const courseJsonLd = JSON.stringify(COURSE_JSON_LD);
  const publishedSet = new Set<string>();
  await Promise.all(
    COURSE_STEPS.map(async (step) => {
      // The EN landing only links a step if its EN MDX is published — falling
      // back to ES content under an EN URL would be a soft 404 to Google.
      if (await hasStepMdx(step.slug, "en")) publishedSet.add(step.slug);
    }),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: courseJsonLd }}
      />
      <FinancebenchLandingView
        locale="en"
        publishedSlugs={Array.from(publishedSet)}
      />
    </>
  );
}
