// ─── Rust Embedded from Zero — Step page (vista compartida ES/EN) ───
//
// Server component. Recibe `locale` + `step` (frontmatter+content cargado por
// `loadStep()`). El caller decide si la página vale la pena renderizar y le
// pasa `otherLocaleAvailable`: cuando el equivalente en el otro idioma no
// existe (paso ES sin traducción EN), el switcher apunta al landing del otro
// locale en lugar de un step EN inexistente.

import Link from "next/link";

import { CompleteButton } from "@/components/course/CompleteButton";
import { CourseContent } from "@/components/course/CourseContent";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { LocaleSwitcher } from "@/components/course/LocaleSwitcher";
import { ScrollToTop } from "@/components/course/ScrollToTop";
import { StepNav } from "@/components/course/StepNav";
import { TOC } from "@/components/course/TOC";
import { extractHeadings } from "@/lib/course/extract-headings";
import { type Locale } from "@/lib/course/i18n";
import { getCourseBaseUrl, getStepUrl } from "@/lib/course/routing";
import { COURSE_TOTAL_STEPS } from "@/lib/course/steps";
import type { CourseFrontmatter } from "@/lib/course/frontmatter";
import { cn } from "@/lib/utils";
import { t } from "@/lib/course/i18n";

interface CourseStepViewProps {
  locale: Locale;
  meta: CourseFrontmatter;
  /** Cuerpo MDX (sin frontmatter). */
  content: string;
  /** True cuando el caller pidió EN pero servimos el ES (legacy — actualmente siempre false porque el step EN sin MDX da 404). */
  fellBackToEs: boolean;
  /** ¿Existe el MDX traducido del paso actual en el otro locale? Define el target del LocaleSwitcher. */
  otherLocaleAvailable: boolean;
}

export function CourseStepView({
  locale,
  meta,
  content,
  fellBackToEs,
  otherLocaleAvailable,
}: CourseStepViewProps) {
  const strings = t(locale);
  const headings = extractHeadings(content);
  const otherLocale: Locale = locale === "es" ? "en" : "es";
  const switcherTarget = otherLocaleAvailable
    ? getStepUrl(meta.slug, otherLocale)
    : getCourseBaseUrl(otherLocale);

  return (
    <div className="course-root course-grain relative flex h-[100dvh] max-h-[100dvh] w-screen max-w-[100vw] flex-col overflow-hidden">
      <div className="flex h-full min-h-0 flex-1 mx-auto w-full max-w-[110rem] gap-10 2xl:gap-14">
        {/* ─── Sidebar izquierda ─── */}
        <aside
          className={cn(
            "hidden w-64 shrink-0 lg:block",
            "overflow-y-auto py-14 md:py-20",
          )}
        >
          <CourseSidebar currentSlug={meta.slug} locale={locale} />
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
          {/* Locale switcher arriba-derecha del contenido */}
          <div className="mb-6 flex items-center justify-end gap-3 max-w-[74ch] lg:max-w-none">
            <LocaleSwitcher currentLocale={locale} targetHref={switcherTarget} />
          </div>

          {/* Legacy: si en algún momento volvemos a aceptar fallback, este
              banner sigue funcionando. Hoy nunca se renderiza. */}
          {fellBackToEs && (
            <div
              className={cn(
                "mb-8 max-w-[74ch] lg:max-w-none",
                "flex flex-wrap items-center gap-x-4 gap-y-2",
                "rounded-md border border-[color:var(--course-accent)]/40",
                "bg-[color:var(--course-accent-soft)]",
                "px-4 py-3 text-sm",
              )}
              role="status"
            >
              <span className="text-[color:var(--course-ink)]">
                {strings.translationInProgressBanner}
              </span>
              <Link
                href={getStepUrl(meta.slug, "es")}
                className={cn(
                  "no-course-style ml-auto",
                  "font-course-mono text-xs font-semibold uppercase tracking-wider",
                  "text-[color:var(--course-accent)] hover:underline",
                )}
              >
                {strings.translationInProgressLink}
              </Link>
            </div>
          )}

          <article className="mx-auto w-full min-w-0 max-w-[74ch] lg:max-w-none">
            <header className="mb-10 md:mb-12">
              <p className="course-kicker mb-4">
                {strings.stepKicker(meta.step, COURSE_TOTAL_STEPS)}
              </p>
              <h1
                className={cn(
                  "font-course-display font-semibold",
                  "text-[1.875rem] md:text-[2.5rem]",
                  "leading-[1.05] tracking-[-0.025em]",
                  "text-[color:var(--course-ink)]",
                )}
              >
                {meta.title
                  .replace(/^Paso\s+\d+\s*[—–-]\s*/i, "")
                  .replace(/^Step\s+\d+\s*[—–-]\s*/i, "")}
              </h1>
            </header>
            <CourseContent source={content} />
          </article>
          <div className="mt-14 flex max-w-[74ch] justify-end lg:max-w-none">
            <CompleteButton stepSlug={meta.slug} locale={locale} />
          </div>
          <div className="max-w-[74ch] lg:max-w-none">
            <StepNav currentSlug={meta.slug} locale={locale} />
          </div>
        </main>

        {/* ─── TOC derecha ─── */}
        <aside
          className={cn(
            "hidden w-96 shrink-0 xl:block",
            "overflow-y-auto py-14 md:py-20",
          )}
        >
          <TOC headings={headings} locale={locale} />
        </aside>
      </div>

      <ScrollToTop scrollContainerId="course-scroll-container" locale={locale} />
    </div>
  );
}
