/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://www.leonobitech.com", // tu dominio principal (sin slash final)
  generateRobotsTxt: true, // también genera robots.txt
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 7000,
  exclude: ["/admin/*", "/private/*"], // opcional
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
  },
};
