// ─── Rust Embedded from Zero — Editorial course landing (EN) ───
//
// Slim wrapper: defines EN metadata + JSON-LD and delegates the render to
// `CourseLandingView`. The Spanish version lives in
// `app/courses/rust-embedded-desde-cero/`.

import type { Metadata } from "next";
import Script from "next/script";

import { CourseLandingView } from "@/components/course/CourseLandingView";
import { COURSE_TITLES, COURSE_TOTAL_STEPS } from "@/lib/course/steps";

const COURSE_DESCRIPTION =
  "Free Rust + embedded systems course from zero on the ESP32-C3. Nine editorial steps to go from not knowing Rust or embedded to having a production IoT firmware with WiFi, WebSocket, scheduler, telemetry and Secure Boot v2.";
const COURSE_URL_EN = "/en/courses/rust-embedded-from-zero";
const COURSE_URL_ES = "/courses/rust-embedded-desde-cero";
const COURSE_OG_IMAGE = "/opengraph-course-rust-embedded.png";

export const metadata: Metadata = {
  title: `${COURSE_TITLES.en} — Free Rust + ESP32-C3 course | Leonobitech`,
  description: COURSE_DESCRIPTION,
  keywords: [
    "Rust embedded",
    "ESP32-C3",
    "Rust ESP-IDF",
    "Rust course",
    "embedded Rust",
    "IoT firmware",
    "WS2812",
    "WiFi embedded",
    "WebSocket embedded",
    "Secure Boot",
    "embedded course English",
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
        alt: "Rust Embedded from Zero — Free course on the ESP32-C3",
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
    inLanguage: "en",
    courseWorkload: "PT5H",
  },
  numberOfCredits: COURSE_TOTAL_STEPS,
  image: [`https://www.leonobitech.com${COURSE_OG_IMAGE}`],
};

export default function CourseLandingPageEn() {
  const courseJsonLd = JSON.stringify(COURSE_JSON_LD);

  return (
    <>
      <Script
        id="course-jsonld-en"
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {courseJsonLd}
      </Script>
      <CourseLandingView locale="en" />
    </>
  );
}
