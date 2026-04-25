// ─── Rust Embedded from Zero — Step player (EN) ───
//
// Solo renderiza pasos que tengan MDX traducido en
// `content/rust-embedded/en/{step-NN-...}.mdx`. Si la traducción no existe,
// devolvemos `notFound()` (404) — preferimos que Google y los lectores no
// encuentren una página EN con contenido ES dentro.
//
// `generateStaticParams` filtra a los slugs traducidos para que el build solo
// pre-rendere lo real.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import { CourseStepView } from "@/components/course/CourseStepView";
import { listTranslatedStepSlugs, loadStep } from "@/lib/course/load-step";
import {
  canonicalizeStepSlug,
  localizeStepSlug,
} from "@/lib/course/routing";
import { COURSE_TITLES, getStepBySlug } from "@/lib/course/steps";

interface PageProps {
  params: Promise<{ stepSlug: string }>;
}

// Cualquier slug fuera de `generateStaticParams` devuelve 404 automáticamente
// — sin esto, Next.js intentaría servir slugs no traducidos en demand y
// caer al `notFound()` interno, lo que en algunos runtimes deja status 200.
export const dynamicParams = false;

export async function generateStaticParams() {
  const translated = await listTranslatedStepSlugs("en");
  return translated.map((esSlug) => ({
    stepSlug: localizeStepSlug(esSlug, "en"),
  }));
}

const STEP_OG_IMAGE = "/opengraph-course-rust-embedded.png";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { stepSlug: enSlug } = await params;
  const esSlug = canonicalizeStepSlug(enSlug, "en");
  if (!esSlug) return {};

  const step = await loadStep(esSlug, "en");
  // Sin traducción EN → la página devolverá 404 abajo, no exponemos metadata.
  if (!step || step.fellBackToEs) return {};

  const stepEntry = getStepBySlug(esSlug);
  const displayTitle = stepEntry?.titleEn ?? step.meta.title;

  const urlEn = `/en/courses/rust-embedded-from-zero/${enSlug}`;
  const urlEs = `/courses/rust-embedded-desde-cero/${esSlug}`;

  return {
    title: `${displayTitle} — ${COURSE_TITLES.en} | Leonobitech`,
    description: step.meta.summary,
    keywords: step.meta.tags,
    alternates: {
      canonical: urlEn,
      languages: {
        es: urlEs,
        en: urlEn,
        "x-default": urlEs,
      },
    },
    openGraph: {
      title: displayTitle,
      description: step.meta.summary,
      type: "article",
      url: urlEn,
      locale: "en_US",
      alternateLocale: ["es_ES"],
      siteName: "Leonobitech",
      publishedTime: step.meta.published_at,
      images: [
        {
          url: STEP_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${displayTitle} — ${COURSE_TITLES.en}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description: step.meta.summary,
      images: [STEP_OG_IMAGE],
    },
  };
}

export default async function StepPageEn({ params }: PageProps) {
  const { stepSlug: enSlug } = await params;
  const esSlug = canonicalizeStepSlug(enSlug, "en");
  if (!esSlug) notFound();

  const step = await loadStep(esSlug, "en");
  if (!step) notFound();
  // No mostrar contenido ES bajo URL EN — si todavía no traducimos, 404.
  if (step.fellBackToEs) notFound();

  const stepEntry = getStepBySlug(esSlug);
  const displayTitle = stepEntry?.titleEn ?? step.meta.title;

  const stepJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: displayTitle,
    description: step.meta.summary,
    inLanguage: "en",
    educationalLevel: "Beginner",
    learningResourceType: "Tutorial",
    position: step.meta.step,
    timeRequired: `PT${step.meta.reading_minutes}M`,
    url: `https://www.leonobitech.com/en/courses/rust-embedded-from-zero/${enSlug}`,
    isPartOf: {
      "@type": "Course",
      name: COURSE_TITLES.en,
      url: "https://www.leonobitech.com/en/courses/rust-embedded-from-zero",
    },
    author: {
      "@type": "Organization",
      name: "Leonobitech",
      url: "https://www.leonobitech.com",
    },
    datePublished: step.meta.published_at,
    keywords: step.meta.tags?.join(", "),
  });

  return (
    <>
      <Script
        id={`step-jsonld-${enSlug}`}
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {stepJsonLd}
      </Script>
      <CourseStepView
        locale="en"
        meta={step.meta}
        content={step.content}
        fellBackToEs={false}
        otherLocaleAvailable
      />
    </>
  );
}
