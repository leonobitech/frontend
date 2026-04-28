// ─── Financial RAG Evaluation Suite — Course landing (EN) ───
//
// Bootstrap landing in English. Mirrors the ES landing structure. The full
// editorial version (hero, story, full index) grows once the first lessons
// land via Trigger A.

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
  const baseUrl = getCourseBaseUrl("en");

  const publishedSet = new Set<string>();
  await Promise.all(
    COURSE_STEPS.map(async (step) => {
      // The EN landing only links a step if its EN MDX is published — falling
      // back to ES content under an EN URL would be a soft 404 to Google.
      if (await hasStepMdx(step.slug, "en")) publishedSet.add(step.slug);
    }),
  );
  const publishedCount = publishedSet.size;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: courseJsonLd }}
      />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Free course · 2026 · Leonobitech
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Financial RAG Evaluation Suite
          <span className="block text-2xl font-semibold text-muted-foreground sm:text-3xl">
            — from Zero
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Rigorous RAG evaluation over financial documents. Five Stages,
          {" "}
          <strong>{COURSE_TOTAL_STEPS} lessons</strong>, closing on a
          paper-quality asset with master table, fine-tuning, and failure
          mode analysis. Each Stage transforms the repo of the previous one.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-border/60 bg-card/50 px-3 py-1 text-muted-foreground">
            FinanceBench + FinMTEB
          </span>
          <span className="rounded-full border border-border/60 bg-card/50 px-3 py-1 text-muted-foreground">
            PyTorch + HuggingFace
          </span>
          <span className="rounded-full border border-border/60 bg-card/50 px-3 py-1 text-muted-foreground">
            5 Stages · {COURSE_TOTAL_STEPS} lessons
          </span>
        </div>

        {publishedCount === 0 && (
          <div className="mt-10 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Coming soon
            </p>
            <p className="mt-2 text-base text-foreground">
              The course bootstrap is in place. Lessons land as each Notion
              memory closes — every lesson anchors to an immutable commit of
              the
              {" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                financebench-rag-eval
              </code>
              {" "}
              repo so you can reproduce the results locally.
            </p>
          </div>
        )}

        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Roadmap by Stage
          </h2>
          <div className="mt-6 space-y-10">
            {COURSE_STAGES.map((stageInfo) => {
              const stepsInStage = getStepsByStage(stageInfo.stage);
              return (
                <div key={stageInfo.stage}>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-xl font-bold text-foreground">
                      Stage {stageInfo.stage} — {stageInfo.titleEn}
                    </h3>
                    <span className="font-mono text-xs text-muted-foreground">
                      {stageInfo.releaseTag}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {stepsInStage.map((step) => {
                      const published = publishedSet.has(step.slug);
                      const enSlug = localizeStepSlug(step.slug, "en");
                      const href = `${baseUrl}/${enSlug}`;
                      return (
                        <li key={step.slug} className="flex items-baseline gap-3">
                          <span className="font-mono text-xs text-muted-foreground">
                            {String(step.step).padStart(2, "0")}
                          </span>
                          {published ? (
                            <Link
                              href={href}
                              className="text-base text-foreground hover:text-primary hover:underline"
                            >
                              {step.titleEn}
                            </Link>
                          ) : (
                            <span className="text-base text-muted-foreground/60">
                              {step.titleEn}
                              <span className="ml-2 text-xs uppercase tracking-wider text-muted-foreground/50">
                                · pending
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

        <section className="mt-16 rounded-xl border border-border/60 bg-card/30 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            This is for you if
          </h2>
          <p className="mt-3 text-base text-foreground">
            You program in Python and understand basic ML, but you&apos;ve
            never rigorously evaluated a RAG system or fine-tuned embeddings.
            You want technical depth for AI Engineer / AI Solutions Architect
            interviews.
          </p>
        </section>
      </main>
    </>
  );
}
