/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://www.leonobitech.com", // tu dominio principal (sin slash final)
  generateRobotsTxt: true, // también genera robots.txt
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 7000,
  exclude: [
    "/dashboard/*",
    "/login",
    "/register",
    "/verify-email",
    "/courses/my-courses",
    "/projects/my-projects",
    "/podcasts/my-podcasts",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/courses",
          "/podcasts",
          "/projects",
          "/blog",
          "/contact",
          "/privacy-policy",
          "/about",
          "/careers",
          "/docs",
          "/help",
          "/community",
        ],
      },
    ],
  },
};
