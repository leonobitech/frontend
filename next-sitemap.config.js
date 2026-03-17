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
  ],
  transform: async (config, path) => {
    if (path === "/") {
      return {
        loc: path,
        changefreq: "daily",
        priority: 1.0,
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
        ],
      },
    ],
  },
};
