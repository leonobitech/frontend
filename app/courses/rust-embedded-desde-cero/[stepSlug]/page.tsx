// ─── Rust Embedded desde Cero — Player del paso ───
//
// Server component. Carga el MDX del filesystem por slug, valida con Zod, y
// renderiza con <CourseContent> + layout (Sidebar/TOC/StepNav).
//
// `generateStaticParams` pre-renderea los 9 pasos en build time para que cada
// URL sea estática y rápida. Si aparece un slug que todavía no tiene MDX,
// `loadStep` retorna null y disparamos `notFound()` → not-found.tsx.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import { CompleteButton } from "@/components/course/CompleteButton";
import { CourseContent } from "@/components/course/CourseContent";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { ScrollToTop } from "@/components/course/ScrollToTop";
import { StepNav } from "@/components/course/StepNav";
import { TOC } from "@/components/course/TOC";
import { extractHeadings } from "@/lib/course/extract-headings";
import { listStepSlugs, loadStep } from "@/lib/course/load-step";
import { COURSE_TITLE, COURSE_TOTAL_STEPS } from "@/lib/course/steps";
import { cn } from "@/lib/utils";

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
  const step = await loadStep(stepSlug);
  if (!step) return {};
  const url = `/courses/rust-embedded-desde-cero/${step.meta.slug}`;
  return {
    title: `${step.meta.title} — ${COURSE_TITLE} | Leonobitech`,
    description: step.meta.summary,
    keywords: step.meta.tags,
    alternates: { canonical: url },
    openGraph: {
      title: step.meta.title,
      description: step.meta.summary,
      type: "article",
      url,
      locale: "es_ES",
      siteName: "Leonobitech",
      publishedTime: step.meta.published_at,
      images: [
        {
          url: STEP_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${step.meta.title} — ${COURSE_TITLE}`,
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
  const step = await loadStep(stepSlug);
  if (!step) notFound();

  const headings = extractHeadings(step.content);

  // LearningResource JSON-LD por paso — cada paso es parte del Course principal.
  // Google indexa esto como "step of course" y permite rich snippets de tutorial.
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
      name: COURSE_TITLE,
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
    // Layout app-like: altura fija = viewport, ancho = viewport (w-screen).
    // El único overflow-y-auto vive en el centro — las sidebars quedan static,
    // sin sticky, sin jitter. `w-screen` es necesario porque sin width fijo
    // el course-root se expande con el contenido (los code blocks anchos
    // tiran del flex layout y rompen el responsive).
    <div className="course-root course-grain relative flex h-[100dvh] max-h-[100dvh] w-screen max-w-[100vw] flex-col overflow-hidden">
      {/* JSON-LD del paso (LearningResource isPartOf Course). next/script
          con children string evita dangerouslySetInnerHTML. */}
      <Script
        id={`step-jsonld-${step.meta.slug}`}
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {stepJsonLd}
      </Script>
      <div className="flex h-full min-h-0 flex-1 mx-auto w-full max-w-[110rem] gap-10 2xl:gap-14">
        {/* ─── Sidebar izquierda — width fijo en cualquier viewport ─── */}
        <aside
          className={cn(
            "hidden w-64 shrink-0 lg:block",
            "overflow-y-auto py-14 md:py-20",
          )}
        >
          <CourseSidebar currentSlug={step.meta.slug} />
        </aside>

        {/* ─── Columna central: única con scroll propio ─── */}
        <main
          id="course-scroll-container"
          data-course-scroll
          className={cn(
            "min-w-0 flex-1",
            "overflow-y-auto overflow-x-clip",
            "pt-14 pb-8 md:pt-20 md:pb-10",
          )}
        >
          <article className="mx-auto w-full min-w-0 max-w-[74ch] lg:max-w-none">
            {/* Hero del paso — kicker mono "PASO N / TOTAL" + título Fraunces.
                Va arriba del MDX para que cada paso se identifique fuerte
                antes del lead intro. */}
            <header className="mb-10 md:mb-12">
              <p className="course-kicker mb-4">
                Paso {String(step.meta.step).padStart(2, "0")} / {String(COURSE_TOTAL_STEPS).padStart(2, "0")}
              </p>
              <h1
                className={cn(
                  "font-course-display font-semibold",
                  "text-[1.875rem] md:text-[2.5rem]",
                  "leading-[1.05] tracking-[-0.025em]",
                  "text-[color:var(--course-ink)]",
                )}
              >
                {step.meta.title.replace(/^Paso\s+\d+\s*[—–-]\s*/i, "")}
              </h1>
            </header>
            <CourseContent source={step.content} />
          </article>
          <div className="mt-14 flex max-w-[74ch] justify-end lg:max-w-none">
            <CompleteButton stepSlug={step.meta.slug} />
          </div>
          <div className="max-w-[74ch] lg:max-w-none">
            <StepNav currentSlug={step.meta.slug} />
          </div>
        </main>

        {/* ─── TOC derecha — width fijo. Solo aparece en xl+ porque
             en lg el centro quedaría muy estrecho con sidebar+TOC fijos. ─── */}
        <aside
          className={cn(
            "hidden w-96 shrink-0 xl:block",
            "overflow-y-auto py-14 md:py-20",
          )}
        >
          <TOC headings={headings} />
        </aside>
      </div>

      {/* Botón flotante "volver arriba" — apunta al scroll container interno */}
      <ScrollToTop scrollContainerId="course-scroll-container" />
    </div>
  );
}
