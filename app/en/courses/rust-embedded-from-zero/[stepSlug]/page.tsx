// ─── Rust Embedded from Zero — Step player (EN) ───
//
// Carga el MDX por slug EN, lo canonicaliza al ES (que es la fuente de
// verdad), y delega el render a `CourseStepView`. Si la traducción EN no
// existe todavía, `loadStep()` cae al ES y la view muestra un banner
// "Translation in progress".

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import { CourseStepView } from "@/components/course/CourseStepView";
import { loadStep } from "@/lib/course/load-step";
import {
  canonicalizeStepSlug,
  listLocalizedStepSlugs,
  localizeStepSlug,
} from "@/lib/course/routing";
import { COURSE_TITLES, getStepBySlug } from "@/lib/course/steps";

interface PageProps {
  params: Promise<{ stepSlug: string }>;
}

export async function generateStaticParams() {
  // Pre-renderea los 9 pasos EN (aunque algunos hagan fallback al ES).
  return listLocalizedStepSlugs("en").map((stepSlug) => ({ stepSlug }));
}

const STEP_OG_IMAGE = "/opengraph-course-rust-embedded.png";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { stepSlug: enSlug } = await params;
  const esSlug = canonicalizeStepSlug(enSlug, "en");
  if (!esSlug) return {};

  const step = await loadStep(esSlug, "en");
  if (!step) return {};

  // Para metadata EN preferimos el título traducido del catálogo (titleEn).
  // Como `meta.title` viene del frontmatter ES, usamos el catálogo aparte.
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

  const stepEntry = getStepBySlug(esSlug);
  const displayTitle = stepEntry?.titleEn ?? step.meta.title;

  // Si la página todavía corre el MDX ES (fellBackToEs=true), seguimos
  // declarando la URL EN como canónica — es la página que Google indexa
  // para EN — pero el JSON-LD describe el LearningResource en EN.
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

  // Override del título display en el meta — la view usa `meta.title` para el
  // hero. Si no hay traducción EN del MDX, el frontmatter sigue trayendo el
  // título ES; lo reemplazamos por el `titleEn` del catálogo. Cuando exista
  // un MDX EN con su propio frontmatter, el `loadedLocale === "en"` y
  // confiamos en el título del archivo EN.
  const metaForView =
    step.loadedLocale === "en"
      ? step.meta
      : { ...step.meta, title: displayTitle };

  // Sanity: localizeStepSlug debe coincidir con `enSlug` (defensa contra
  // slugs malformados que pasaron canonicalizeStepSlug).
  void localizeStepSlug(esSlug, "en");

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
        meta={metaForView}
        content={step.content}
        fellBackToEs={step.fellBackToEs}
      />
    </>
  );
}
