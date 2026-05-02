"use client";

// ─── Financial RAG Evaluation Suite — Landing interactivo (ES + EN) ───
//
// Client component scroll-driven. Renderiza el landing del curso financebench
// con: hero parallax + counters animados, sticky progress rail desktop con
// dots que se iluminan al scrollear, stage panels con stagger reveal, closing
// CTA slide-up. Todas las animaciones tienen fallback `prefers-reduced-motion`.
//
// El page wrapper (server component) calcula `publishedSlugs` y delega acá —
// la lista de slugs publicados se serializa como string[] (no Set) para no
// romper la barrera RSC → Client.

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Check, Circle } from "lucide-react";
import Link from "next/link";

import { COURSE_STAGES, COURSE_TOTAL_STEPS, getStepsByStage } from "@/lib/course-financebench/steps";
import { getCourseBaseUrl, localizeStepSlug } from "@/lib/course-financebench/routing";
import type { Locale } from "@/lib/course-config/types";
import { cn } from "@/lib/utils";

// ─── i18n localizado ─────────────────────────────────────────────────────

interface Strings {
  kicker: string;
  heroLine1: string;
  heroLine2: string;
  heroAccent: string;
  lead: (totalSteps: number) => string;
  leadHighlight: (totalSteps: number) => string;
  metrics: { value: number; label: string }[];
  roadmapKicker: string;
  pendingLabel: string;
  forYouKicker: string;
  forYouBody: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  ctaHref: string;
}

const STRINGS_ES: Strings = {
  kicker: "Curso gratuito · 2026 · Leonobitech",
  heroLine1: "Financial RAG",
  heroLine2: "Evaluation Suite",
  heroAccent: "from Zero",
  lead: (n) =>
    `Evaluación rigurosa de RAG sobre dominio financiero. Cinco Stages, __HL__, hasta cerrar en un activo paper-quality con tabla maestra, fine-tuning y failure mode analysis. Cada Stage transforma el repo del anterior.`,
  leadHighlight: (n) => `${n} lessons`,
  metrics: [
    { value: 150, label: "QA pairs" },
    { value: 20, label: "embedders × chunking" },
    { value: COURSE_TOTAL_STEPS, label: "lessons" },
  ],
  roadmapKicker: "Roadmap por Stage",
  pendingLabel: "pendiente",
  forYouKicker: "Para ti si",
  forYouBody:
    "Programás en Python y entendés ML básico, pero nunca evaluaste rigurosamente un sistema RAG ni hiciste fine-tuning de embeddings. Buscás profundidad técnica para entrevistas de AI Engineer / AI Solutions Architect senior.",
  ctaTitle: "Empezar el curso",
  ctaBody:
    "Cada lesson tiene anchor a un commit inmutable del repo financebench-rag-eval. Reproducís resultados localmente o avanzás como spectator.",
  ctaButton: "Ir al primer paso",
  ctaHref: "/courses/financial-rag-eval-from-zero/paso-01-foundation-setup",
};

const STRINGS_EN: Strings = {
  kicker: "Free course · 2026 · Leonobitech",
  heroLine1: "Financial RAG",
  heroLine2: "Evaluation Suite",
  heroAccent: "from Zero",
  lead: (n) =>
    `Rigorous RAG evaluation over financial documents. Five Stages, __HL__, closing on a paper-quality asset with master table, fine-tuning, and failure mode analysis. Each Stage transforms the repo of the previous one.`,
  leadHighlight: (n) => `${n} lessons`,
  metrics: [
    { value: 150, label: "QA pairs" },
    { value: 20, label: "embedders × chunking" },
    { value: COURSE_TOTAL_STEPS, label: "lessons" },
  ],
  roadmapKicker: "Roadmap by Stage",
  pendingLabel: "pending",
  forYouKicker: "This is for you if",
  forYouBody:
    "You program in Python and understand basic ML, but you've never rigorously evaluated a RAG system or fine-tuned embeddings. You want technical depth for AI Engineer / AI Solutions Architect interviews.",
  ctaTitle: "Start the course",
  ctaBody:
    "Each lesson anchors to an immutable commit of the financebench-rag-eval repo. Reproduce the results locally or follow along as a spectator.",
  ctaButton: "Go to first step",
  ctaHref: "/en/courses/financial-rag-eval-from-zero/step-01-foundation-setup",
};

// ─── Top-level view ──────────────────────────────────────────────────────

interface FinancebenchLandingViewProps {
  locale: Locale;
  /** Slugs ES (canónicos) de las lessons que ya tienen MDX publicado. */
  publishedSlugs: string[];
}

export function FinancebenchLandingView({
  locale,
  publishedSlugs,
}: FinancebenchLandingViewProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const t = locale === "es" ? STRINGS_ES : STRINGS_EN;
  const baseUrl = getCourseBaseUrl(locale);
  const publishedSet = new Set(publishedSlugs);

  return (
    <div className="course-root course-financebench course-grain relative min-h-screen overflow-x-clip">
      <Hero t={t} reducedMotion={reducedMotion} />
      <StagesSection
        locale={locale}
        baseUrl={baseUrl}
        publishedSet={publishedSet}
        t={t}
        reducedMotion={reducedMotion}
      />
      <ClosingCTA t={t} reducedMotion={reducedMotion} />
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────

function Hero({ t, reducedMotion }: { t: Strings; reducedMotion: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Parallax sutil del título — se mueve más lento que el body al scroll.
  const titleY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, -80]);
  const titleOpacity = useTransform(
    scrollYProgress,
    [0, 0.6, 1],
    reducedMotion ? [1, 1, 1] : [1, 1, 0],
  );

  const lead = t.lead(COURSE_TOTAL_STEPS);
  const highlight = t.leadHighlight(COURSE_TOTAL_STEPS);
  const [leadBefore, leadAfter] = lead.split("__HL__");

  return (
    <section
      ref={ref}
      className="relative pt-16 pb-12 md:pt-24 md:pb-20"
    >
      {/* Glow ambient detrás del título — pista visual del accent teal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 mx-auto max-w-5xl"
        style={{
          background:
            "radial-gradient(ellipse 700px 400px at 30% 30%, rgba(63, 207, 197, 0.10), transparent 70%)",
        }}
      />

      <motion.div
        style={{ y: titleY, opacity: titleOpacity }}
        className="mx-auto max-w-5xl px-6"
      >
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="course-kicker mb-6"
        >
          {t.kicker}
        </motion.p>
        <motion.h1
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-course-display text-5xl font-medium leading-[0.95] tracking-tight text-[color:var(--course-ink)] sm:text-6xl md:text-7xl"
        >
          {t.heroLine1}
          <br />
          <span className="italic text-[color:var(--course-accent)]">
            {t.heroLine2}
          </span>
          <span className="ml-3 align-middle font-course-mono text-base font-normal text-[color:var(--course-ink-mute)] sm:text-lg md:ml-4">
            — {t.heroAccent}
          </span>
        </motion.h1>
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-[color:var(--course-ink-soft)]"
        >
          {leadBefore}
          <strong className="font-medium text-[color:var(--course-ink)]">
            {highlight}
          </strong>
          {leadAfter}
        </motion.p>

        {/* Metric counters — se animan al entrar viewport */}
        <div className="mt-14 grid max-w-3xl grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-3 md:gap-x-12">
          {t.metrics.map((m, i) => (
            <MetricCounter
              key={m.label}
              value={m.value}
              label={m.label}
              order={i}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ─── Metric counter (anim al entrar viewport) ────────────────────────────

interface MetricCounterProps {
  value: number;
  label: string;
  order: number;
  reducedMotion: boolean;
}

function MetricCounter({ value, label, order, reducedMotion }: MetricCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayed, setDisplayed] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (!isInView) return;
    if (reducedMotion) {
      setDisplayed(value);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplayed(Math.floor(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplayed(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, value, reducedMotion]);

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: order * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-[color:var(--course-border-strong)] pt-4"
    >
      <div className="font-course-display text-5xl font-medium tabular-nums tracking-tight text-[color:var(--course-accent)] md:text-6xl">
        {displayed}
      </div>
      <div className="mt-2 font-course-mono text-[11px] uppercase tracking-wider text-[color:var(--course-ink-mute)]">
        {label}
      </div>
    </motion.div>
  );
}

// ─── Stages section con sticky progress rail ─────────────────────────────

interface StagesSectionProps {
  locale: Locale;
  baseUrl: string;
  publishedSet: Set<string>;
  t: Strings;
  reducedMotion: boolean;
}

function StagesSection({
  locale,
  baseUrl,
  publishedSet,
  t,
  reducedMotion,
}: StagesSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70vh", "end 30vh"],
  });

  return (
    <section className="relative px-6 py-12 md:py-20">
      <div
        ref={containerRef}
        className="mx-auto flex max-w-5xl gap-10 lg:gap-16"
      >
        {/* Sticky progress rail (desktop only) */}
        <ProgressRail
          scrollYProgress={scrollYProgress}
          reducedMotion={reducedMotion}
        />

        <div className="min-w-0 flex-1">
          <p className="course-kicker mb-10">{t.roadmapKicker}</p>
          <div className="space-y-16 md:space-y-24">
            {COURSE_STAGES.map((stageInfo) => (
              <StagePanel
                key={stageInfo.stage}
                stageInfo={stageInfo}
                locale={locale}
                baseUrl={baseUrl}
                publishedSet={publishedSet}
                reducedMotion={reducedMotion}
                pendingLabel={t.pendingLabel}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Sticky progress rail (5 dots iluminándose con scroll) ───────────────

interface ProgressRailProps {
  scrollYProgress: MotionValue<number>;
  reducedMotion: boolean;
}

function ProgressRail({ scrollYProgress, reducedMotion }: ProgressRailProps) {
  // En reduced-motion, fill se queda en 0 — los dots se renderean estáticos
  // con su estado pasivo (los stage panels igual aparecen via stagger reveal
  // que también respeta reducedMotion).
  const fillHeight = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? ["0%", "0%"] : ["0%", "100%"],
  );

  return (
    <div className="hidden shrink-0 lg:block">
      <div className="sticky top-28 h-[60vh] w-12">
        <div className="relative h-full w-full">
          {/* Track de fondo */}
          <span
            aria-hidden
            className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-[color:var(--course-border-strong)]"
          />
          {/* Fill animado del rail */}
          <motion.span
            aria-hidden
            style={{ height: fillHeight }}
            className="absolute left-1/2 top-0 -translate-x-1/2 w-px bg-[color:var(--course-accent)]"
          />
          {/* 5 dots — uno por stage */}
          {COURSE_STAGES.map((s, i) => (
            <RailDot
              key={s.stage}
              index={i}
              total={COURSE_STAGES.length}
              scrollYProgress={scrollYProgress}
              releaseTag={s.releaseTag}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RailDotProps {
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  releaseTag: string;
  reducedMotion: boolean;
}

function RailDot({
  index,
  total,
  scrollYProgress,
  releaseTag,
  reducedMotion,
}: RailDotProps) {
  // Dot está "activo" cuando el scroll progress alcanza su threshold.
  const threshold = total === 1 ? 0 : index / (total - 1);
  const lower = Math.max(0, threshold - 0.04);

  const opacity = useTransform(
    scrollYProgress,
    [lower, threshold],
    reducedMotion ? [1, 1] : [0.3, 1],
  );
  const scale = useTransform(
    scrollYProgress,
    [lower, threshold],
    reducedMotion ? [1, 1] : [0.7, 1],
  );

  return (
    <div
      style={{ top: `${(index / Math.max(1, total - 1)) * 100}%` }}
      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <motion.span
        aria-hidden
        style={{ opacity, scale }}
        className="block size-3 rounded-full bg-[color:var(--course-accent)] shadow-[0_0_12px_rgba(63,207,197,0.6)]"
      />
      <span
        aria-hidden
        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap font-course-mono text-[10px] tabular-nums uppercase tracking-wider text-[color:var(--course-ink-mute)]"
      >
        {releaseTag}
      </span>
    </div>
  );
}

// ─── Stage panel (header + lessons con stagger reveal) ────────────────────

interface StagePanelProps {
  stageInfo: (typeof COURSE_STAGES)[number];
  locale: Locale;
  baseUrl: string;
  publishedSet: Set<string>;
  reducedMotion: boolean;
  pendingLabel: string;
}

function StagePanel({
  stageInfo,
  locale,
  baseUrl,
  publishedSet,
  reducedMotion,
  pendingLabel,
}: StagePanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const stepsInStage = getStepsByStage(stageInfo.stage);
  const stageTitle = locale === "es" ? stageInfo.titleEs : stageInfo.titleEn;

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? false : { opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-course-mono text-xs text-[color:var(--course-ink-mute)]">
          STAGE {String(stageInfo.stage).padStart(2, "0")}
        </span>
        <span className="text-[color:var(--course-ink-mute)]/40">·</span>
        <span className="font-course-mono text-xs text-[color:var(--course-accent)]">
          {stageInfo.releaseTag}
        </span>
      </div>
      <h3 className="font-course-display text-3xl font-medium leading-tight text-[color:var(--course-ink)] md:text-4xl">
        <span className="italic text-[color:var(--course-accent)]">
          {stageTitle}
        </span>
      </h3>
      <ul className="mt-7 space-y-1 border-l border-[color:var(--course-border)] pl-5">
        {stepsInStage.map((step, i) => {
          const published = publishedSet.has(step.slug);
          const stepLocalized = localizeStepSlug(step.slug, locale);
          const href = `${baseUrl}/${stepLocalized}`;
          const title = locale === "es" ? step.title : step.titleEn;

          return (
            <motion.li
              key={step.slug}
              initial={reducedMotion ? false : { opacity: 0, x: -8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.4,
                delay: 0.15 + i * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {published ? (
                <Link
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 py-2.5 -ml-7 pl-2",
                    "transition-colors",
                  )}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--course-accent-soft)]">
                    <Check
                      className="size-3 text-[color:var(--course-accent)]"
                      strokeWidth={3}
                      aria-hidden
                    />
                  </span>
                  <span className="font-course-mono text-xs tabular-nums text-[color:var(--course-ink-mute)]">
                    {String(step.step).padStart(2, "0")}
                  </span>
                  <span className="text-base text-[color:var(--course-ink)] transition-colors group-hover:text-[color:var(--course-accent)]">
                    {title}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 py-2.5 -ml-7 pl-2">
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    <Circle
                      className="size-2.5 text-[color:var(--course-ink-mute)]/40"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </span>
                  <span className="font-course-mono text-xs tabular-nums text-[color:var(--course-ink-mute)]/50">
                    {String(step.step).padStart(2, "0")}
                  </span>
                  <span className="text-base text-[color:var(--course-ink-mute)]">
                    {title}
                  </span>
                  <span className="font-course-mono text-[10px] uppercase tracking-wider text-[color:var(--course-ink-mute)]/50">
                    · {pendingLabel}
                  </span>
                </div>
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}

// ─── Closing CTA — slide-up al entrar viewport ──────────────────────────

function ClosingCTA({ t, reducedMotion }: { t: Strings; reducedMotion: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-150px" });

  return (
    <section className="relative px-6 pb-24 pt-12 md:pb-32 md:pt-20">
      <motion.div
        ref={ref}
        initial={reducedMotion ? false : { opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-4xl"
      >
        {/* Para ti si — block editorial */}
        <div className="rounded-2xl border border-[color:var(--course-border)] bg-[color:var(--course-surface)]/40 p-8 md:p-10">
          <p className="course-kicker mb-4">{t.forYouKicker}</p>
          <p className="font-course-display text-2xl font-medium leading-snug text-[color:var(--course-ink)] md:text-3xl">
            {t.forYouBody}
          </p>
        </div>

        {/* CTA primario al primer paso */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-[color:var(--course-accent)]/30 bg-gradient-to-br from-[color:var(--course-accent-soft)] to-transparent p-8 md:flex-row md:items-center md:justify-between md:p-10"
        >
          <div>
            <p className="course-kicker mb-2 text-[color:var(--course-accent)]">
              {t.ctaTitle}
            </p>
            <p className="max-w-xl text-base leading-relaxed text-[color:var(--course-ink)]">
              {t.ctaBody}
            </p>
          </div>
          <Link
            href={t.ctaHref}
            className={cn(
              "group inline-flex shrink-0 items-center gap-2.5",
              "rounded-full bg-[color:var(--course-accent)]",
              "px-6 py-3 font-course-mono text-xs font-semibold uppercase tracking-wider text-[#0F1620]",
              "shadow-[0_8px_30px_-4px_rgba(63,207,197,0.4)]",
              "transition-all duration-300",
              "hover:-translate-y-0.5 hover:bg-[color:var(--course-accent-deep)]",
            )}
          >
            {t.ctaButton}
            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
              strokeWidth={2.5}
            />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
