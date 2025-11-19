/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

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
  // Agregar rutas dinámicas de blog
  additionalPaths: async (config) => {
    const result = [];

    // Leer los archivos markdown del blog
    const contentDir = path.join(__dirname, "content", "blog");

    try {
      const files = fs.readdirSync(contentDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      mdFiles.forEach((file) => {
        const slug = file.replace(".md", "");
        result.push({
          loc: `/blog/${slug}`,
          changefreq: "weekly",
          priority: 0.8,
          lastmod: new Date().toISOString(),
        });
      });
    } catch (error) {
      console.warn("Could not read blog content directory:", error.message);
    }

    return result;
  },
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
          "/blog/*",
          "/contact",
          "/legal",
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
