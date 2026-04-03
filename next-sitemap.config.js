/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://www.leonobitech.com",
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
    if (path === "/") {
      return {
        loc: path,
        changefreq: "daily",
        priority: 1.0,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    if (path === "/blog") {
      return {
        loc: path,
        changefreq: "daily",
        priority: 0.9,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    if (path.startsWith("/blog/")) {
      return {
        loc: path,
        changefreq: "weekly",
        priority: 0.8,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    if (path === "/courses") {
      return {
        loc: path,
        changefreq: "daily",
        priority: 0.9,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    if (path.startsWith("/courses/")) {
      return {
        loc: path,
        changefreq: "weekly",
        priority: 0.8,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      };
    }
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
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
        ],
      },
    ],
  },
};
