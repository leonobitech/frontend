// ─── Financial RAG Evaluation Suite — Player del paso (ES) ───
//
// Server component. Carga el MDX del filesystem por slug, valida con Zod, y
// renderiza con `<CourseStepView>`. Wrapper finito: define metadata/JSON-LD en
// español y delega el layout a la view compartida.
//
// Nota — Bootstrap (Misión 0): `<CourseStepView>` está acoplado a
// `lib/course/` (rust-embedded). Mientras NO haya MDX en
// `content/financebench/`, este componente no se monta (generateStaticParams
// devuelve []). Cuando aterrice la primera lesson via Trigger A, hay que
// adaptar `<CourseStepView>` para aceptar el course config como prop o
// clonarlo. Este archivo queda preparado para ese momento.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

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

  // Bootstrap render (Misión 0) — placeholder readable hasta que adaptemos
  // <CourseStepView> al course config de financebench. NO llega acá en
  // bootstrap real porque generateStaticParams devuelve [] sin MDX.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stepJsonLd }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {COURSE_TITLES.es} · Paso {String(step.meta.step).padStart(2, "0")} / {String(step.meta.step).padStart(2, "0")}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          {step.meta.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{step.meta.subtitle}</p>
        <div className="prose prose-zinc dark:prose-invert mt-10 max-w-none">
          {/*
            TODO (post-Misión 0): renderizar el MDX con CourseContent +
            componentes mdx-map. Hoy mostramos un mensaje hasta que
            <CourseStepView> esté parametrizado para financebench.
          */}
          <p className="text-sm italic text-muted-foreground">
            Render MDX pendiente — esta lesson cuenta con frontmatter válido
            pero el componente CourseStepView todavía está acoplado a
            rust-embedded. Próximo paso: adaptar la vista compartida.
          </p>
        </div>
      </article>
    </>
  );
}
