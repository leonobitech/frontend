/** @type {import('next-sitemap').IConfig} */
const fs = require("node:fs");
const path = require("node:path");

const SITE = "https://www.leonobitech.com";

// Mapa de slugs ES → EN del curso Rust Embedded. Mantener en sync con
// `lib/course/steps.ts` y `lib/course/routing.ts`.
const RUST_COURSE_STEPS_ES = [
  "paso-01-scaffold",
  "paso-02-wifi-station",
  "paso-03-led-pwm",
  "paso-04-websocket-client",
  "paso-05-light-state-management",
  "paso-06-telemetry",
  "paso-07-time-sync-sntp",
  "paso-08-schedule-auto-mode",
  "paso-09-concurrencia-watchdog",
];
const esSlugToEn = (esSlug) => esSlug.replace(/^paso-/, "step-");

// Pasos ES que efectivamente tienen MDX traducido al inglés en
// `content/rust-embedded/en/`. Solo estos van al sitemap como URLs EN
// (y reciben hreflang en sus pares ES). Los demás siguen apareciendo en ES
// pero sin alternate `en` — Google no los promete como traducidos.
const TRANSLATED_EN_STEPS_ES = (() => {
  try {
    const enDir = path.join(process.cwd(), "content", "rust-embedded", "en");
    const files = fs.readdirSync(enDir);
    const enSlugs = new Set(
      files
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => f.replace(/\.mdx$/, "")),
    );
    return RUST_COURSE_STEPS_ES.filter((esSlug) =>
      enSlugs.has(esSlugToEn(esSlug)),
    );
  } catch {
    // Dir no existe todavía → ningún paso está traducido.
    return [];
  }
})();
const HAS_EN_TRANSLATION = new Set(TRANSLATED_EN_STEPS_ES);

const RUST_COURSE_BASE_ES = "/courses/rust-embedded-desde-cero";
const RUST_COURSE_BASE_EN = "/en/courses/rust-embedded-from-zero";

// hreflang alternates pa' una URL del curso. La landing siempre tiene par EN,
// pero los step pages solo lo declaran si el MDX EN existe — caso contrario
// solo emitimos `es` + `x-default` para evitar soft 404 en Google.
function buildRustCourseAlternates(esPath) {
  const isLanding = esPath === RUST_COURSE_BASE_ES;
  let enPath = null;
  if (isLanding) {
    enPath = RUST_COURSE_BASE_EN;
  } else {
    const slug = esPath.slice(`${RUST_COURSE_BASE_ES}/`.length);
    if (HAS_EN_TRANSLATION.has(slug)) {
      enPath = `${RUST_COURSE_BASE_EN}/${esSlugToEn(slug)}`;
    }
  }
  // hrefIsAbsolute es importante: sin él, next-sitemap concatena siteUrl +
  // currentPath + href y rompe los enlaces.
  const refs = [
    { hreflang: "es", href: `${SITE}${esPath}`, hrefIsAbsolute: true },
    { hreflang: "x-default", href: `${SITE}${esPath}`, hrefIsAbsolute: true },
  ];
  if (enPath) {
    refs.splice(1, 0, {
      hreflang: "en",
      href: `${SITE}${enPath}`,
      hrefIsAbsolute: true,
    });
  }
  return refs;
}

// Mapeo path EN → path ES. Permite calcular alternates para las URLs EN
// reusando la misma función.
function rustCourseEnToEs(enPath) {
  if (enPath === RUST_COURSE_BASE_EN) return RUST_COURSE_BASE_ES;
  const slug = enPath.slice(`${RUST_COURSE_BASE_EN}/`.length);
  return `${RUST_COURSE_BASE_ES}/${slug.replace(/^step-/, "paso-")}`;
}

// Solo las URLs que tienen equivalente real en ambos locales. No incluir
// el assessment ni otras subrutas hasta que estén traducidas — si ponemos
// hreflang a una URL EN que no existe, Google la marca como soft 404.
function isRustCourseTranslatedEsPath(p) {
  if (p === RUST_COURSE_BASE_ES) return true;
  return RUST_COURSE_STEPS_ES.some(
    (slug) => p === `${RUST_COURSE_BASE_ES}/${slug}`,
  );
}

function isRustCourseTranslatedEnPath(p) {
  if (p === RUST_COURSE_BASE_EN) return true;
  return TRANSLATED_EN_STEPS_ES.some(
    (slug) => p === `${RUST_COURSE_BASE_EN}/${esSlugToEn(slug)}`,
  );
}

module.exports = {
  siteUrl: SITE,
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 7000,
  exclude: [
    "/dashboard",
    "/dashboard/*",
    "/login",
    "/register",
    "/verify-email",
    "/forgot-password",
    "/auth/*",
    "/settings",
    "/admin/*",
  ],
  additionalPaths: async (config) => {
    const paths = [];

    // Rust Embedded course — landing EN siempre va al sitemap. Los step pages
    // EN solo si tienen MDX traducido (`TRANSLATED_EN_STEPS_ES`).
    paths.push({
      loc: RUST_COURSE_BASE_EN,
      changefreq: "daily",
      priority: 0.9,
      lastmod: new Date().toISOString(),
      alternateRefs: buildRustCourseAlternates(RUST_COURSE_BASE_ES),
    });
    for (const esSlug of TRANSLATED_EN_STEPS_ES) {
      const enPath = `${RUST_COURSE_BASE_EN}/${esSlugToEn(esSlug)}`;
      paths.push({
        loc: enPath,
        changefreq: "weekly",
        priority: 0.8,
        lastmod: new Date().toISOString(),
        alternateRefs: buildRustCourseAlternates(`${RUST_COURSE_BASE_ES}/${esSlug}`),
      });
    }

    // Fetch published courses from backend API
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://core.leonobitech.com";
      const res = await fetch(`${apiUrl}/courses`);
      if (res.ok) {
        const json = await res.json();
        const courses = json.data || [];
        for (const course of courses) {
          paths.push({
            loc: `/courses/${course.slug}`,
            changefreq: "weekly",
            priority: 0.8,
            lastmod: course.updatedAt || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Silently fail — courses won't appear in sitemap if API is unreachable
    }

    return paths;
  },
  transform: async (config, path) => {
    const lastmod = config.autoLastmod ? new Date().toISOString() : undefined;

    // Rust Embedded course — agregar hreflang alternates para SEO multi-idioma.
    if (isRustCourseTranslatedEsPath(path)) {
      return {
        loc: path,
        changefreq: path === RUST_COURSE_BASE_ES ? "daily" : "weekly",
        priority: path === RUST_COURSE_BASE_ES ? 0.9 : 0.8,
        lastmod,
        alternateRefs: buildRustCourseAlternates(path),
      };
    }
    if (isRustCourseTranslatedEnPath(path)) {
      const esEquivalent = rustCourseEnToEs(path);
      return {
        loc: path,
        changefreq: path === RUST_COURSE_BASE_EN ? "daily" : "weekly",
        priority: path === RUST_COURSE_BASE_EN ? 0.9 : 0.8,
        lastmod,
        alternateRefs: buildRustCourseAlternates(esEquivalent),
      };
    }

    if (path === "/") {
      return { loc: path, changefreq: "daily", priority: 1.0, lastmod };
    }
    if (path === "/blog") {
      return { loc: path, changefreq: "daily", priority: 0.9, lastmod };
    }
    if (path.startsWith("/blog/")) {
      return { loc: path, changefreq: "weekly", priority: 0.8, lastmod };
    }
    if (path === "/courses") {
      return { loc: path, changefreq: "daily", priority: 0.9, lastmod };
    }
    if (path.startsWith("/courses/")) {
      return { loc: path, changefreq: "weekly", priority: 0.8, lastmod };
    }
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod,
    };
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/login",
          "/register",
          "/verify-email",
          "/forgot-password",
          "/auth/*",
          "/settings",
          "/admin/*",
          "/_next/",
        ],
      },
    ],
  },
};
