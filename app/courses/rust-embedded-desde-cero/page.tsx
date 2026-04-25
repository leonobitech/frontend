// ─── Rust Embedded desde Cero — Landing editorial del curso ───

import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

import { ScrollToTop } from "@/components/course/ScrollToTop";
import {
  COURSE_BASE_URL,
  COURSE_STEPS,
  COURSE_TITLE,
  COURSE_TOTAL_STEPS,
} from "@/lib/course/steps";

const COURSE_DESCRIPTION =
  "Curso gratis de Rust + sistemas embedded desde cero sobre ESP32-C3. 9 pasos editoriales para ir de no saber Rust ni embedded a tener un firmware IoT en producción con WiFi, WebSocket, scheduler, telemetría y Secure Boot v2.";
const COURSE_URL = "/courses/rust-embedded-desde-cero";
const COURSE_OG_IMAGE = "/esp32-c3.png";

export const metadata: Metadata = {
  title: `${COURSE_TITLE} — Curso gratuito de Rust + ESP32-C3 | Leonobitech`,
  description: COURSE_DESCRIPTION,
  keywords: [
    "Rust embedded",
    "ESP32-C3",
    "Rust ESP-IDF",
    "curso Rust",
    "embedded Rust",
    "firmware IoT",
    "WS2812",
    "WiFi embedded",
    "WebSocket embedded",
    "Secure Boot",
    "curso embedded español",
    "Leonobitech",
  ],
  alternates: { canonical: COURSE_URL },
  openGraph: {
    title: COURSE_TITLE,
    description: COURSE_DESCRIPTION,
    type: "article",
    url: COURSE_URL,
    locale: "es_ES",
    siteName: "Leonobitech",
    images: [
      {
        url: COURSE_OG_IMAGE,
        width: 640,
        height: 528,
        alt: "ESP32-C3 DevKit RUST-1 — hardware del curso Rust Embedded desde Cero",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: COURSE_TITLE,
    description: COURSE_DESCRIPTION,
    images: [COURSE_OG_IMAGE],
  },
};

const COURSE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: COURSE_TITLE,
  description: COURSE_DESCRIPTION,
  url: `https://www.leonobitech.com${COURSE_URL}`,
  inLanguage: "es",
  isAccessibleForFree: true,
  educationalLevel: "Beginner",
  about: [
    "Rust",
    "Embedded systems",
    "ESP32-C3",
    "IoT firmware",
    "WiFi provisioning",
    "WebSocket",
    "Secure Boot",
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
    courseWorkload: "PT5H",
  },
  numberOfCredits: COURSE_TOTAL_STEPS,
  image: `https://www.leonobitech.com${COURSE_OG_IMAGE}`,
};

export default function CourseLandingPage() {
  const firstStep = COURSE_STEPS[0];

  const courseJsonLd = JSON.stringify(COURSE_JSON_LD);

  return (
    <div className="course-root course-grain relative min-h-screen">
      {/* Course JSON-LD para rich snippets de Google. Hardcoded — no input
          de usuario, no XSS posible. */}
      <Script
        id="course-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {courseJsonLd}
      </Script>
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        {/* ─── Hero editorial ─── */}
        <section className="mb-16">
          <div className="course-reveal course-reveal-1 mb-4 flex items-center gap-3">
            <span className="inline-block h-[2px] w-10 bg-[color:var(--course-accent)]" />
            <p className="course-kicker">
              Curso gratuito · 2026
            </p>
          </div>

          <h1
            className={cx(
              "course-reveal course-reveal-2",
              "font-course-display text-5xl font-medium leading-[0.98]",
              "tracking-[-0.03em] text-[color:var(--course-ink)]",
              "sm:text-6xl md:text-7xl lg:text-[5.5rem]",
            )}
          >
            <span className="whitespace-nowrap">Rust Embedded</span>
            <br />
            <span className="italic text-[color:var(--course-accent)]">
              desde Cero
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
            Nueve pasos para ir de{" "}
            <em className="font-course-display font-normal italic text-[color:var(--course-ink)]">
              no sé Rust ni embedded
            </em>{" "}
            a tener un firmware IoT corriendo en un ESP32-C3. Cada paso
            transforma el código del anterior — no es cortar y pegar de un
            proyecto terminado, es un arco donde aprendes mientras el
            firmware crece.
          </p>

          <div className="course-reveal course-reveal-4 mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href={`${COURSE_BASE_URL}/${firstStep.slug}`}
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
              Empezar por el Paso 01
              <ArrowRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
                strokeWidth={2.5}
              />
            </Link>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-course-mono text-[11px] uppercase tracking-wider text-[color:var(--course-ink-mute)]">
              <span>{COURSE_TOTAL_STEPS} pasos</span>
              <span className="h-2 w-px bg-[color:var(--course-border-strong)]" />
              <span>ESP32-C3</span>
              <span className="h-2 w-px bg-[color:var(--course-border-strong)]" />
              <span>Rust + ESP-IDF</span>
              <span className="h-2 w-px bg-[color:var(--course-border-strong)]" />
              <span>Español</span>
            </div>
          </div>
        </section>

        {/* ─── Value props: editorial triplet ─── */}
        <section className="mb-28 grid gap-10 border-y border-[color:var(--course-border-strong)] py-12 md:grid-cols-3 md:gap-12">
          <div>
            <p className="course-kicker mb-3 text-[color:var(--course-accent)]">
              Para ti si
            </p>
            <p className="font-course-display text-xl leading-snug text-[color:var(--course-ink)]">
              Ya programas en algún lenguaje pero nunca tocaste Rust ni
              sistemas embedded.
            </p>
          </div>
          <div>
            <p className="course-kicker mb-3 text-[color:var(--course-accent)]">
              Vas a entender
            </p>
            <p className="font-course-display text-xl leading-snug text-[color:var(--course-ink)]">
              El <em className="italic">por qué</em> de cada decisión, no
              solo el <em className="italic">cómo</em>. Ownership, RAII,
              WiFi provisioning, WebSocket, watchdog.
            </p>
          </div>
          <div>
            <p className="course-kicker mb-3 text-[color:var(--course-accent)]">
              Requisitos
            </p>
            <p className="font-course-display text-xl leading-snug text-[color:var(--course-ink)]">
              Una placa ESP32-C3-DevKit-RUST-1 (opcional — el código compila
              sin ella). Terminal y ganas.
            </p>
          </div>
        </section>

        {/* ─── Outline de los 9 pasos ─── */}
        <section className="mb-24">
          <div className="mb-10 flex items-baseline justify-between">
            <div>
              <p className="course-kicker mb-2">Índice</p>
              <h2 className="font-course-display text-3xl font-medium tracking-tight text-[color:var(--course-ink)] sm:text-4xl">
                Los <span className="italic text-[color:var(--course-accent)]">9 pasos</span>
              </h2>
            </div>
            <span className="font-course-mono text-xs text-[color:var(--course-ink-mute)]">
              01 → 09
            </span>
          </div>

          <ol className="relative">
            {/* Track vertical izquierdo */}
            <span
              aria-hidden
              className="absolute left-[52px] top-2 bottom-2 w-px bg-[color:var(--course-border)]"
            />
            {COURSE_STEPS.map((step) => (
              <li key={step.slug}>
                <Link
                  href={`${COURSE_BASE_URL}/${step.slug}`}
                  className={cx(
                    "group relative flex items-center gap-6 py-5",
                    "border-b border-[color:var(--course-border)]",
                    "transition-colors duration-300",
                  )}
                >
                  {/* Número */}
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

                  {/* Título */}
                  <span
                    className={cx(
                      "flex-1 font-course-display text-xl font-medium",
                      "text-[color:var(--course-ink)]",
                      "transition-transform duration-300",
                      "group-hover:translate-x-1",
                    )}
                  >
                    {step.title}
                  </span>

                  {/* Arrow */}
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
          {/* El horizonte */}
          <div
            className={cx(
              "relative overflow-hidden rounded-lg p-8",
              "border border-[color:var(--course-border)]",
              "bg-[color:var(--course-surface)]/60",
            )}
          >
            <p className="course-kicker mb-4">El horizonte</p>
            <p className="font-course-display text-lg leading-snug text-[color:var(--course-ink)]">
              Al terminar el paso 9 tienes un firmware IoT con WiFi +
              WebSocket + schedule + watchdog que habla con un backend y{" "}
              <em className="italic text-[color:var(--course-accent)]">
                no se cuelga en producción
              </em>
              . Todo construido paso a paso, sin atajos.
            </p>
          </div>

          {/* Assessment */}
          <div
            className={cx(
              "relative overflow-hidden rounded-lg p-8",
              "border border-[color:var(--course-accent)]/30",
              "bg-gradient-to-br from-[color:var(--course-accent-soft)] to-transparent",
            )}
          >
            <p className="course-kicker mb-4 text-[color:var(--course-accent)]">
              Assessment final
            </p>
            <p className="mb-6 font-course-display text-lg leading-snug text-[color:var(--course-ink)]">
              9 preguntas meta-integradoras. Aprobando con 70% o más,
              reclamas tu certificado de graduación.
            </p>
            <Link
              href={`${COURSE_BASE_URL}/assessment`}
              className={cx(
                "group inline-flex items-center gap-2",
                "font-course-mono text-xs font-semibold uppercase tracking-wider",
                "text-[color:var(--course-accent)]",
                "transition-colors",
              )}
            >
              Ir al assessment
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
                strokeWidth={2.5}
              />
            </Link>
          </div>
        </section>
      </div>

      {/* Botón flotante "volver arriba" — aparece tras scroll > 400px */}
      <ScrollToTop />
    </div>
  );
}

// helper local para clsx-style joins sin traerse la dep
function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}
