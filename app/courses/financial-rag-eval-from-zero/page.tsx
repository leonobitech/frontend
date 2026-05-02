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
import Link from "next/link";

import {
  COURSE_STAGES,
  COURSE_STEPS,
  COURSE_TITLES,
  COURSE_TOTAL_STEPS,
  getStepsByStage,
} from "@/lib/course-financebench/steps";
import { localizeStepSlug, getCourseBaseUrl } from "@/lib/course-financebench/routing";
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
  const baseUrl = getCourseBaseUrl("es");

  // Marcar qué lessons ya tienen MDX publicado (Trigger A ejecutado).
  const publishedSet = new Set<string>();
  await Promise.all(
    COURSE_STEPS.map(async (step) => {
      if (await hasStepMdx(step.slug, "es")) publishedSet.add(step.slug);
    }),
  );
  const publishedCount = publishedSet.size;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: courseJsonLd }}
      />
      <div className="course-root course-financebench course-grain relative min-h-screen">
        <main className="mx-auto max-w-4xl px-6 py-16">
          <p className="course-kicker">
            Curso gratuito · 2026 · Leonobitech
          </p>
          <h1 className="mt-4 font-course-display text-4xl font-medium tracking-tight text-[color:var(--course-ink)] sm:text-5xl">
            Financial RAG Evaluation Suite
            <span className="block text-2xl font-medium italic text-[color:var(--course-accent)] sm:text-3xl">
              — from Zero
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--course-ink-soft)]">
            Evaluación rigurosa de RAG sobre dominio financiero. Cinco Stages,
            {" "}
            <strong className="text-[color:var(--course-ink)]">{COURSE_TOTAL_STEPS} lessons</strong>, hasta cerrar en un
            activo paper-quality con tabla maestra, fine-tuning, y failure
            mode analysis. Cada Stage transforma el repo del anterior.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-[color:var(--course-border-strong)] bg-[color:var(--course-surface)]/50 px-3 py-1 text-[color:var(--course-ink-soft)]">
              FinanceBench + FinMTEB
            </span>
            <span className="rounded-full border border-[color:var(--course-border-strong)] bg-[color:var(--course-surface)]/50 px-3 py-1 text-[color:var(--course-ink-soft)]">
              PyTorch + HuggingFace
            </span>
            <span className="rounded-full border border-[color:var(--course-border-strong)] bg-[color:var(--course-surface)]/50 px-3 py-1 text-[color:var(--course-ink-soft)]">
              5 Stages · {COURSE_TOTAL_STEPS} lessons
            </span>
          </div>

          {publishedCount === 0 && (
            <div
              className="mt-10 rounded-xl border p-6"
              style={{
                borderColor: "var(--course-amber-soft)",
                background: "var(--course-amber-soft)",
              }}
            >
              <p className="font-course-mono text-xs font-semibold uppercase tracking-wider text-[color:var(--course-amber)]">
                Próximamente
              </p>
              <p className="mt-2 text-base leading-relaxed text-[color:var(--course-ink)]">
                El bootstrap del curso está listo y las lessons aterrizan a
                medida que cada memoria descriptiva en Notion se cierre. Cada
                lesson va a tener su anchor a un commit inmutable del repo
                {" "}
                <code className="rounded bg-[color:var(--course-surface-code)] px-1.5 py-0.5 font-course-mono text-sm">
                  financebench-rag-eval
                </code>
                {" "}
                para que puedas reproducir resultados localmente.
              </p>
            </div>
          )}

          {/* Roadmap por Stage */}
          <section className="mt-16">
            <p className="course-kicker">Roadmap por Stage</p>
            <div className="mt-6 space-y-10">
              {COURSE_STAGES.map((stageInfo) => {
                const stepsInStage = getStepsByStage(stageInfo.stage);
                return (
                  <div key={stageInfo.stage}>
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-course-display text-xl font-medium text-[color:var(--course-ink)]">
                        Stage {stageInfo.stage} —{" "}
                        <span className="italic text-[color:var(--course-accent)]">{stageInfo.titleEs}</span>
                      </h3>
                      <span className="font-course-mono text-xs text-[color:var(--course-ink-mute)]">
                        {stageInfo.releaseTag}
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {stepsInStage.map((step) => {
                        const published = publishedSet.has(step.slug);
                        const href = `${baseUrl}/${localizeStepSlug(step.slug, "es")}`;
                        return (
                          <li key={step.slug} className="flex items-baseline gap-3">
                            <span className="font-course-mono text-xs text-[color:var(--course-ink-mute)]">
                              {String(step.step).padStart(2, "0")}
                            </span>
                            {published ? (
                              <Link
                                href={href}
                                className="text-base text-[color:var(--course-ink)] transition-colors hover:text-[color:var(--course-accent)]"
                              >
                                {step.title}
                              </Link>
                            ) : (
                              <span className="text-base text-[color:var(--course-ink-mute)]">
                                {step.title}
                                <span className="ml-2 font-course-mono text-xs uppercase tracking-wider text-[color:var(--course-ink-mute)]/60">
                                  · pendiente
                                </span>
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-16 rounded-xl border border-[color:var(--course-border)] bg-[color:var(--course-surface)]/40 p-6">
            <p className="course-kicker">Para ti si</p>
            <p className="mt-3 text-base leading-relaxed text-[color:var(--course-ink)]">
              Programás en Python y entendés ML básico, pero nunca evaluaste
              rigurosamente un sistema RAG ni hiciste fine-tuning de embeddings.
              Buscás profundidad técnica para entrevistas de AI Engineer / AI
              Solutions Architect senior.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
