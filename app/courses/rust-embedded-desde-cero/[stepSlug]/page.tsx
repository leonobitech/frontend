// ─── Rust Embedded desde Cero — Player del paso (ES) ───
//
// Server component. Carga el MDX del filesystem por slug, valida con Zod, y
// renderiza con <CourseStepView>. Wrapper finito: define metadata/JSON-LD en
// español y delega el layout a la view compartida.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import { CourseStepView } from "@/components/course/CourseStepView";
import { listStepSlugs, loadStep } from "@/lib/course/load-step";
import { localizeStepSlug } from "@/lib/course/routing";
import { COURSE_TITLES } from "@/lib/course/steps";

interface PageProps {
  params: Promise<{ stepSlug: string }>;
}

export async function generateStaticParams() {
  const slugs = await listStepSlugs();
  return slugs.map((stepSlug) => ({ stepSlug }));
}

const STEP_OG_IMAGE = "/opengraph-course-rust-embedded.png";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { stepSlug } = await params;
  const step = await loadStep(stepSlug, "es");
  if (!step) return {};
  const urlEs = `/courses/rust-embedded-desde-cero/${step.meta.slug}`;
  const urlEn = `/en/courses/rust-embedded-from-zero/${localizeStepSlug(step.meta.slug, "en")}`;
  return {
    title: `${step.meta.title} — ${COURSE_TITLES.es} | Leonobitech`,
    description: step.meta.summary,
    keywords: step.meta.tags,
    alternates: {
      canonical: urlEs,
      languages: {
        es: urlEs,
        en: urlEn,
        "x-default": urlEs,
      },
    },
    openGraph: {
      title: step.meta.title,
      description: step.meta.summary,
      type: "article",
      url: urlEs,
      locale: "es_ES",
      alternateLocale: ["en_US"],
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

  // LearningResource JSON-LD por paso — cada paso es parte del Course principal.
  const stepJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: step.meta.title,
    description: step.meta.summary,
    inLanguage: "es",
    educationalLevel: "Beginner",
    learningResourceType: "Tutorial",
    position: step.meta.step,
    timeRequired: `PT${step.meta.reading_minutes}M`,
    url: `https://www.leonobitech.com/courses/rust-embedded-desde-cero/${step.meta.slug}`,
    isPartOf: {
      "@type": "Course",
      name: COURSE_TITLES.es,
      url: "https://www.leonobitech.com/courses/rust-embedded-desde-cero",
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
        id={`step-jsonld-${step.meta.slug}`}
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {stepJsonLd}
      </Script>
      <CourseStepView
        locale="es"
        meta={step.meta}
        content={step.content}
        fellBackToEs={false}
      />
    </>
  );
}
