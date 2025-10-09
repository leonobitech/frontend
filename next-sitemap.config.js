/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://www.leonobitech.com", // tu dominio principal (sin slash final)
  generateRobotsTxt: true, // también genera robots.txt
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 7000,
  exclude: [
    "/dashboard",
    "/dashboard/*",
    "/login",
    "/register",
    "/verify-email",
    "/gallery/saved",
    "/projects/my-projects",
    "/podcasts/my-podcasts",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/gallery",
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
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/login",
          "/register",
          "/verify-email",
          "/gallery/saved",
          "/projects/my-projects",
          "/podcasts/my-podcasts",
        ],
      },
    ],
  },
};
