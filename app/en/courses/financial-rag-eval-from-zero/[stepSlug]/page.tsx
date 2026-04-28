// ─── Financial RAG Evaluation Suite — Step player (EN) ───
//
// Only renders steps that have translated MDX in
// `content/financebench/en/{step-NN-...}.mdx`. If the translation does not
// exist, returns `notFound()` (404) — we prefer that Google and readers do
// not find an EN page with ES content inside.
//
// `generateStaticParams` filters to translated slugs so the build only
// pre-renders real EN pages.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  listTranslatedStepSlugs,
  loadStep,
} from "@/lib/course-financebench/load-step";
import {
  canonicalizeStepSlug,
  localizeStepSlug,
} from "@/lib/course-financebench/routing";
import {
  COURSE_TITLES,
  getStepBySlug,
} from "@/lib/course-financebench/steps";

interface PageProps {
  params: Promise<{ stepSlug: string }>;
}

// Any slug outside `generateStaticParams` returns 404 automatically — without
// this, Next.js would try to serve untranslated slugs on demand and fall to
// the internal `notFound()`, which in some runtimes leaves status 200.
export const dynamicParams = false;

export async function generateStaticParams() {
  const translated = await listTranslatedStepSlugs("en");
  return translated.map((esSlug) => ({
    stepSlug: localizeStepSlug(esSlug, "en"),
  }));
}

const STEP_OG_IMAGE = "/opengraph-course-rust-embedded.png"; // TODO: dedicated financebench image

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { stepSlug: enSlug } = await params;
  const esSlug = canonicalizeStepSlug(enSlug, "en");
  if (!esSlug) return {};

  const step = await loadStep(esSlug, "en");
  if (!step || step.fellBackToEs) return {};

  const stepEntry = getStepBySlug(esSlug);
  const displayTitle = stepEntry?.titleEn ?? step.meta.title;

  const urlEn = `/en/courses/financial-rag-eval-from-zero/${enSlug}`;
  const urlEs = `/courses/financial-rag-eval-from-zero/${esSlug}`;

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
  if (step.fellBackToEs) notFound();

  const stepEntry = getStepBySlug(esSlug);
  const displayTitle = stepEntry?.titleEn ?? step.meta.title;

  const stepJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: displayTitle,
    description: step.meta.summary,
    inLanguage: "en",
    educationalLevel: "Intermediate",
    learningResourceType: "Tutorial",
    position: step.meta.step,
    timeRequired: `PT${step.meta.reading_minutes}M`,
    url: `https://www.leonobitech.com/en/courses/financial-rag-eval-from-zero/${enSlug}`,
    isPartOf: {
      "@type": "Course",
      name: COURSE_TITLES.en,
      url: "https://www.leonobitech.com/en/courses/financial-rag-eval-from-zero",
    },
    author: {
      "@type": "Organization",
      name: "Leonobitech",
      url: "https://www.leonobitech.com",
    },
    datePublished: step.meta.published_at,
    keywords: step.meta.tags?.join(", "),
  });

  // Bootstrap render — placeholder until <CourseStepView> is parameterized
  // for the financebench course config.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stepJsonLd }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {COURSE_TITLES.en} · Step {String(step.meta.step).padStart(2, "0")}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          {displayTitle}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{step.meta.subtitle}</p>
        <div className="prose prose-zinc dark:prose-invert mt-10 max-w-none">
          <p className="text-sm italic text-muted-foreground">
            MDX render pending — this lesson has a valid frontmatter but the
            shared CourseStepView is still coupled to rust-embedded. Next
            step: parameterize the shared view.
          </p>
        </div>
      </article>
    </>
  );
}
