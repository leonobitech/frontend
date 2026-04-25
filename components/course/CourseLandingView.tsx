// ─── Rust Embedded from Zero — Landing editorial (vista compartida ES/EN) ───
//
// Server component. Recibe `locale` + `firstStepSlug` (ES canónico) y renderiza
// la landing en el idioma pedido. Las páginas concretas
// (`app/courses/rust-embedded-desde-cero/page.tsx` y
// `app/en/courses/rust-embedded-from-zero/page.tsx`) son wrappers finitos que
// definen metadata/JSON-LD por locale y delegan acá.

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/course/LocaleSwitcher";
import { ScrollToTop } from "@/components/course/ScrollToTop";
import { t, type Locale } from "@/lib/course/i18n";
import { getCourseBaseUrl, getStepUrl } from "@/lib/course/routing";
import {
  COURSE_STEPS,
  COURSE_TOTAL_STEPS,
  getStepTitle,
} from "@/lib/course/steps";

interface CourseLandingViewProps {
  locale: Locale;
}

export function CourseLandingView({ locale }: CourseLandingViewProps) {
  const strings = t(locale);
  const firstStep = COURSE_STEPS[0];
  const otherLocale: Locale = locale === "es" ? "en" : "es";

  return (
    <div className="course-root course-grain relative min-h-screen">
      {/* Locale switcher fijo arriba a la derecha. Las landings siempre
          tienen equivalente en ambos idiomas, así que el switcher apunta
          directo al landing del otro locale. */}
      <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">
        <LocaleSwitcher
          currentLocale={locale}
          targetHref={getCourseBaseUrl(otherLocale)}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        {/* ─── Hero editorial ─── */}
        <section className="mb-16">
          <div className="course-reveal course-reveal-1 mb-4 flex items-center gap-3">
            <span className="inline-block h-[2px] w-10 bg-[color:var(--course-accent)]" />
            <p className="course-kicker">{strings.freeCourseEyebrow}</p>
          </div>

          <h1
            className={cx(
              "course-reveal course-reveal-2",
              "font-course-display text-5xl font-medium leading-[0.98]",
              "tracking-[-0.03em] text-[color:var(--course-ink)]",
              "sm:text-6xl md:text-7xl lg:text-[5.5rem]",
            )}
          >
            <span className="whitespace-nowrap">{strings.heroLine1}</span>
            <br />
            <span className="italic text-[color:var(--course-accent)]">
              {strings.heroLine2}
            </span>
          </h1>

          {/* Imagen del board ESP32-C3 — debajo del título como marca visual
              del hardware del curso. */}
          <div className="course-reveal course-reveal-2 -mt-24">
            <Image
              src="/esp32-c3.png"
              alt="ESP32-C3 DevKit RUST-1"
              width={420}
              height={420}
              priority
              className="h-auto w-60 sm:w-72 md:w-80 lg:w-96"
            />
          </div>

          <p
            className={cx(
              "course-reveal course-reveal-3",
              "-mt-12 max-w-2xl text-lg leading-relaxed",
              "text-[color:var(--course-ink-soft)]",
              "sm:text-xl",
            )}
          >
            {strings.heroLead("__HIGHLIGHT__").split("__HIGHLIGHT__").map((chunk, i, arr) => (
              <span key={i}>
                {chunk}
                {i < arr.length - 1 && (
                  <em className="font-course-display font-normal italic text-[color:var(--course-ink)]">
                    {strings.heroLeadHighlight}
                  </em>
                )}
              </span>
            ))}
          </p>

          <div className="course-reveal course-reveal-4 mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href={getStepUrl(firstStep.slug, locale)}
              className={cx(
                "group inline-flex items-center gap-2.5",
                "rounded-full bg-[color:var(--course-accent)]",
                "px-6 py-3 font-course-mono text-xs font-semibold",
                "uppercase tracking-wider text-white",
                "shadow-[0_8px_30px_-4px_rgba(232,115,78,0.4)]",
                "transition-all duration-300",
                "hover:translate-y-[-2px] hover:bg-[color:var(--course-accent)]/90",
              )}
            >
              {strings.ctaStartFirst}
              <ArrowRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
                strokeWidth={2.5}
              />
            </Link>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-course-mono text-[11px] uppercase tracking-wider text-[color:var(--course-ink-mute)]">
              <span>{strings.metaSteps(COURSE_TOTAL_STEPS)}</span>
              <span className="h-2 w-px bg-[color:var(--course-border-strong)]" />
              <span>{strings.metaBoard}</span>
              <span className="h-2 w-px bg-[color:var(--course-border-strong)]" />
              <span>{strings.metaStack}</span>
              <span className="h-2 w-px bg-[color:var(--course-border-strong)]" />
              <span>{strings.metaLanguage}</span>
            </div>
          </div>
        </section>

        {/* ─── Value props: editorial triplet ─── */}
        <section className="mb-28 grid gap-10 border-y border-[color:var(--course-border-strong)] py-12 md:grid-cols-3 md:gap-12">
          <div>
            <p className="course-kicker mb-3 text-[color:var(--course-accent)]">
              {strings.forYouIfKicker}
            </p>
            <p className="font-course-display text-xl leading-snug text-[color:var(--course-ink)]">
              {strings.forYouIfBody}
            </p>
          </div>
          <div>
            <p className="course-kicker mb-3 text-[color:var(--course-accent)]">
              {strings.willUnderstandKicker}
            </p>
            <p className="font-course-display text-xl leading-snug text-[color:var(--course-ink)]">
              {strings
                .willUnderstandBody("__WHY__", "__HOW__")
                .split(/__WHY__|__HOW__/)
                .map((chunk, i, arr) => (
                  <span key={i}>
                    {chunk}
                    {i === 0 && (
                      <em className="italic">{strings.whyWord}</em>
                    )}
                    {i === 1 && (
                      <em className="italic">{strings.howWord}</em>
                    )}
                  </span>
                ))}
            </p>
          </div>
          <div>
            <p className="course-kicker mb-3 text-[color:var(--course-accent)]">
              {strings.requirementsKicker}
            </p>
            <p className="font-course-display text-xl leading-snug text-[color:var(--course-ink)]">
              {strings.requirementsBody}
            </p>
          </div>
        </section>

        {/* ─── Outline de los 9 pasos ─── */}
        <section className="mb-24">
          <div className="mb-10 flex items-baseline justify-between">
            <div>
              <p className="course-kicker mb-2">{strings.indexKicker}</p>
              <h2 className="font-course-display text-3xl font-medium tracking-tight text-[color:var(--course-ink)] sm:text-4xl">
                {strings.indexTitle}{" "}
                <span className="italic text-[color:var(--course-accent)]">
                  {strings.indexHighlight}
                </span>
              </h2>
            </div>
            <span className="font-course-mono text-xs text-[color:var(--course-ink-mute)]">
              01 → 09
            </span>
          </div>

          <ol className="relative">
            <span
              aria-hidden
              className="absolute left-[52px] top-2 bottom-2 w-px bg-[color:var(--course-border)]"
            />
            {COURSE_STEPS.map((step) => (
              <li key={step.slug}>
                <Link
                  href={getStepUrl(step.slug, locale)}
                  className={cx(
                    "group relative flex items-center gap-6 py-5",
                    "border-b border-[color:var(--course-border)]",
                    "transition-colors duration-300",
                  )}
                >
                  <span
                    className={cx(
                      "relative z-10 grid size-[52px] shrink-0 place-items-center",
                      "rounded-full border border-[color:var(--course-border-strong)]",
                      "bg-[color:var(--course-bg)]",
                      "font-course-mono text-sm font-semibold tabular-nums",
                      "text-[color:var(--course-ink-soft)]",
                      "transition-all duration-300",
                      "group-hover:border-[color:var(--course-accent)]",
                      "group-hover:bg-[color:var(--course-accent-soft)]",
                      "group-hover:text-[color:var(--course-accent)]",
                    )}
                  >
                    {String(step.step).padStart(2, "0")}
                  </span>

                  <span
                    className={cx(
                      "flex-1 font-course-display text-xl font-medium",
                      "text-[color:var(--course-ink)]",
                      "transition-transform duration-300",
                      "group-hover:translate-x-1",
                    )}
                  >
                    {getStepTitle(step, locale)}
                  </span>

                  <ArrowUpRight
                    className={cx(
                      "size-4 shrink-0 opacity-0 transition-all duration-300",
                      "text-[color:var(--course-accent)]",
                      "group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100",
                    )}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* ─── Horizonte + Assessment como bloque editorial ─── */}
        <section className="grid gap-6 md:grid-cols-2">
          <div
            className={cx(
              "relative overflow-hidden rounded-lg p-8",
              "border border-[color:var(--course-border)]",
              "bg-[color:var(--course-surface)]/60",
            )}
          >
            <p className="course-kicker mb-4">{strings.horizonKicker}</p>
            <p className="font-course-display text-lg leading-snug text-[color:var(--course-ink)]">
              {strings
                .horizonBody("__WIN__")
                .split("__WIN__")
                .map((chunk, i, arr) => (
                  <span key={i}>
                    {chunk}
                    {i < arr.length - 1 && (
                      <em className="italic text-[color:var(--course-accent)]">
                        {strings.horizonWin}
                      </em>
                    )}
                  </span>
                ))}
            </p>
          </div>

          <div
            className={cx(
              "relative overflow-hidden rounded-lg p-8",
              "border border-[color:var(--course-accent)]/30",
              "bg-gradient-to-br from-[color:var(--course-accent-soft)] to-transparent",
            )}
          >
            <p className="course-kicker mb-4 text-[color:var(--course-accent)]">
              {strings.assessmentKicker}
            </p>
            <p className="mb-6 font-course-display text-lg leading-snug text-[color:var(--course-ink)]">
              {strings.assessmentBody}
            </p>
            <Link
              href={`${getCourseBaseUrl(locale)}/assessment`}
              className={cx(
                "group inline-flex items-center gap-2",
                "font-course-mono text-xs font-semibold uppercase tracking-wider",
                "text-[color:var(--course-accent)]",
                "transition-colors",
              )}
            >
              {strings.assessmentCta}
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
                strokeWidth={2.5}
              />
            </Link>
          </div>
        </section>
      </div>

      <ScrollToTop locale={locale} />
    </div>
  );
}

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}
