// ─── Vista compartida del paso (ES/EN) — parametrizada por curso ───
//
// Server component. Recibe `course: CourseConfig` + `locale` + `meta`/`content`
// del paso (cargados por `loadStep()` del lib del curso correspondiente).
// El caller decide si la página vale la pena renderizar y le pasa
// `otherLocaleAvailable`: cuando el equivalente en el otro idioma no existe
// (paso ES sin traducción EN), el switcher apunta al landing del otro locale
// en lugar de un step EN inexistente.
//
// El <CourseConfigProvider> debe estar montado más arriba (en el layout
// del curso). Los client children (TOC, ScrollToTop, CompleteButton) leen
// el config vía useCourseConfig(); los server children (CourseSidebar,
// LocaleSwitcher, StepNav) lo reciben acá como prop.

import Link from "next/link";

import { CompleteButton } from "@/components/course/CompleteButton";
import { CourseContent } from "@/components/course/CourseContent";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { LocaleSwitcher } from "@/components/course/LocaleSwitcher";
import { RepoCard } from "@/components/course/RepoCard";
import { ScrollToTop } from "@/components/course/ScrollToTop";
import { StepNav } from "@/components/course/StepNav";
import { TOC } from "@/components/course/TOC";
import { extractHeadings } from "@/lib/course/extract-headings";
import type {
  BaseFrontmatter,
  CourseConfig,
  Locale,
} from "@/lib/course-config/types";
import { cn } from "@/lib/utils";

interface CourseStepViewProps {
  /** Config del curso. */
  course: CourseConfig;
  locale: Locale;
  meta: BaseFrontmatter;
  /** Cuerpo MDX (sin frontmatter). */
  content: string;
  /** True cuando el caller pidió EN pero servimos el ES (legacy — actualmente siempre false porque el step EN sin MDX da 404). */
  fellBackToEs: boolean;
  /** ¿Existe el MDX traducido del paso actual en el otro locale? Define el target del LocaleSwitcher. */
  otherLocaleAvailable: boolean;
}

export function CourseStepView({
  course,
  locale,
  meta,
  content,
  fellBackToEs,
  otherLocaleAvailable,
}: CourseStepViewProps) {
  const strings = course.t(locale);
  const headings = extractHeadings(content);
  const otherLocale: Locale = locale === "es" ? "en" : "es";
  const switcherTarget = otherLocaleAvailable
    ? course.getStepUrl(meta.slug, otherLocale)
    : course.getCourseBaseUrl(otherLocale);

  return (
    <div
      className={cn(
        "course-root course-grain relative flex h-[100dvh] max-h-[100dvh] w-screen max-w-[100vw] flex-col overflow-hidden",
        course.themeClassName,
      )}
    >
      <div className="flex h-full min-h-0 flex-1 mx-auto w-full max-w-[110rem] gap-10 2xl:gap-14">
        {/* ─── Sidebar izquierda ─── */}
        <aside
          className={cn(
            "hidden w-64 shrink-0 lg:block",
            "overflow-y-auto py-14 md:py-20",
          )}
        >
          <CourseSidebar course={course} currentSlug={meta.slug} locale={locale} />
        </aside>

        {/* ─── Columna central: única con scroll propio ─── */}
        <main
          id="course-scroll-container"
          data-course-scroll
          className={cn(
            "min-w-0 flex-1",
            "overflow-y-auto overflow-x-clip",
            "pt-6 pb-8 md:pt-20 md:pb-10",
            // Padding horizontal sólo cuando no hay sidebars visibles. En lg+
            // las sidebars izquierda/derecha proveen el aire lateral y el main
            // queda sin margen propio para mantener el ancho del contenido.
            "px-5 sm:px-8 lg:px-0",
          )}
        >
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
                href={course.getStepUrl(meta.slug, "es")}
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
              {/* Kicker + LocaleSwitcher en la misma línea — el switcher
                  queda alineado a la derecha sin ocupar fila propia. En
                  desktop la altura del switcher empata con la del kicker. */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="course-kicker">
                  {strings.stepKicker(meta.step, course.totalSteps)}
                </p>
                <LocaleSwitcher
                  course={course}
                  currentLocale={locale}
                  targetHref={switcherTarget}
                />
              </div>
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
            {/* Card del repo de GitHub — entre el título y el contenido. */}
            <div className="mb-10 md:mb-12">
              <RepoCard
                repoUrl={meta.repo_url}
                label={strings.repoCardLabel}
                cta={strings.repoCardCta}
              />
            </div>
            <CourseContent source={content} />
          </article>
          <div className="mt-14 flex max-w-[74ch] justify-end lg:max-w-none">
            <CompleteButton stepSlug={meta.slug} locale={locale} />
          </div>
          <div className="max-w-[74ch] lg:max-w-none">
            <StepNav course={course} currentSlug={meta.slug} locale={locale} />
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
