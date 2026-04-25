// ─── Rust Embedded desde Cero — Landing editorial del curso (ES) ───
//
// Wrapper finito: define metadata + JSON-LD en español y delega el render a
// `CourseLandingView`. La versión EN vive en `app/en/courses/rust-embedded-from-zero/`.

import type { Metadata } from "next";

import { CourseLandingView } from "@/components/course/CourseLandingView";
import { COURSE_TITLES, COURSE_TOTAL_STEPS } from "@/lib/course/steps";

const COURSE_DESCRIPTION =
  "Curso gratis de Rust + sistemas embedded desde cero sobre ESP32-C3. 9 pasos editoriales para ir de no saber Rust ni embedded a tener un firmware IoT en producción con WiFi, WebSocket, scheduler, telemetría y Secure Boot v2.";
const COURSE_URL = "/courses/rust-embedded-desde-cero";
const COURSE_URL_EN = "/en/courses/rust-embedded-from-zero";
const COURSE_OG_IMAGE = "/opengraph-course-rust-embedded.png";

export const metadata: Metadata = {
  title: `${COURSE_TITLES.es} — Curso gratuito de Rust + ESP32-C3 | Leonobitech`,
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
        alt: "Rust Embedded desde Cero — Curso gratuito sobre ESP32-C3",
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
  image: [`https://www.leonobitech.com${COURSE_OG_IMAGE}`],
};

export default function CourseLandingPage() {
  const courseJsonLd = JSON.stringify(COURSE_JSON_LD);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: courseJsonLd }}
      />
      <CourseLandingView locale="es" />
    </>
  );
}
