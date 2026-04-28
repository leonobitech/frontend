// ─── Financial RAG Evaluation Suite — Player del paso (ES) ───
//
// Server component. Carga el MDX del filesystem por slug, valida con Zod, y
// renderiza con `<CourseStepView>` (parametrizado vía `course={financebenchConfig}`).
// Wrapper finito: define metadata/JSON-LD en español y delega el layout a la
// view compartida.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CourseStepView } from "@/components/course/CourseStepView";
import { financebenchConfig } from "@/lib/course-config/configs/financebench";
import {
  hasStepMdx,
  listStepSlugs,
  loadStep,
} from "@/lib/course-financebench/load-step";
import { localizeStepSlug } from "@/lib/course-financebench/routing";
import { COURSE_TITLES } from "@/lib/course-financebench/steps";

interface PageProps {
  params: Promise<{ stepSlug: string }>;
}

export async function generateStaticParams() {
  const slugs = await listStepSlugs();
  return slugs.map((stepSlug) => ({ stepSlug }));
}

const STEP_OG_IMAGE = "/opengraph-course-rust-embedded.png"; // TODO: imagen propia financebench

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { stepSlug } = await params;
  const step = await loadStep(stepSlug, "es");
  if (!step) return {};
  const urlEs = `/courses/financial-rag-eval-from-zero/${step.meta.slug}`;

  const hasEnTranslation = await hasStepMdx(step.meta.slug, "en");
  const languages: Record<string, string> = {
    es: urlEs,
    "x-default": urlEs,
  };
  if (hasEnTranslation) {
    languages.en = `/en/courses/financial-rag-eval-from-zero/${localizeStepSlug(step.meta.slug, "en")}`;
  }

  return {
    title: `${step.meta.title} — ${COURSE_TITLES.es} | Leonobitech`,
    description: step.meta.summary,
    keywords: step.meta.tags,
    alternates: {
      canonical: urlEs,
      languages,
    },
    openGraph: {
      title: step.meta.title,
      description: step.meta.summary,
      type: "article",
      url: urlEs,
      locale: "es_ES",
      alternateLocale: hasEnTranslation ? ["en_US"] : [],
      siteName: "Leonobitech",
      publishedTime: step.meta.published_at,
      images: [
        {
          url: STEP_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${step.meta.title} — ${COURSE_TITLES.es}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: step.meta.title,
      description: step.meta.summary,
      images: [STEP_OG_IMAGE],
    },
  };
}

export default async function StepPage({ params }: PageProps) {
  const { stepSlug } = await params;
  const step = await loadStep(stepSlug, "es");
  if (!step) notFound();

  const hasEnTranslation = await hasStepMdx(step.meta.slug, "en");

  const stepJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: step.meta.title,
    description: step.meta.summary,
    inLanguage: "es",
    educationalLevel: "Intermediate",
    learningResourceType: "Tutorial",
    position: step.meta.step,
    timeRequired: `PT${step.meta.reading_minutes}M`,
    url: `https://www.leonobitech.com/courses/financial-rag-eval-from-zero/${step.meta.slug}`,
    isPartOf: {
      "@type": "Course",
      name: COURSE_TITLES.es,
      url: "https://www.leonobitech.com/courses/financial-rag-eval-from-zero",
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
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: stepJsonLd }}
      />
      <CourseStepView
        course={financebenchConfig}
        locale="es"
        meta={step.meta}
        content={step.content}
        fellBackToEs={false}
        otherLocaleAvailable={hasEnTranslation}
      />
    </>
  );
}
