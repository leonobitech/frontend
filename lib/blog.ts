import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { seasons, type Season } from "@/content/blog/seasons";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

export interface SlideDataItem {
  type: "cover" | "content" | "cta";
  title: string;
  subtitle?: string;
  body?: string;
  items?: { emoji: string; text: string }[];
  pillars?: { emoji: string; label: string }[];
  platforms?: { emoji: string; name: string; desc: string }[];
  coffeeTip?: string;
  question?: string;
  cta?: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  episode: number;
  season: string;
  seasonTitle: string;
  series: string;
  description: string;
  date: string;
  linkedInUrl: string;
  tags: string[];
  slides: number;
  slideData: SlideDataItem[];
  slideImages: string[];
  status: string;
}

export interface Post extends PostMeta {
  content: string;
}

export function getAllPosts(): PostMeta[] {
  const posts: PostMeta[] = [];

  for (const season of seasons) {
    const seasonDir = path.join(CONTENT_DIR, season.slug);
    if (!fs.existsSync(seasonDir)) continue;

    const files = fs
      .readdirSync(seasonDir)
      .filter((f) => f.endsWith(".mdx"));

    for (const file of files) {
      const filePath = path.join(seasonDir, file);
      const source = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(source);
      const slug = file.replace(/\.mdx$/, "");

      posts.push({
        slug,
        title: data.title,
        episode: data.episode,
        season: data.season,
        seasonTitle: data.seasonTitle,
        series: data.series,
        description: data.description,
        date: data.date,
        linkedInUrl: data.linkedInUrl || "",
        tags: data.tags || [],
        slides: data.slides || 0,
        slideData: data.slideData || [],
        slideImages: data.slideImages || [],
        status: data.status || "draft",
      });
    }
  }

  return posts.sort((a, b) => {
    const seasonA = seasons.findIndex((s) => s.slug === a.season);
    const seasonB = seasons.findIndex((s) => s.slug === b.season);
    if (seasonA !== seasonB) return seasonA - seasonB;
    return a.episode - b.episode;
  });
}

export function getPostsBySeason(seasonSlug: string): PostMeta[] {
  return getAllPosts().filter((p) => p.season === seasonSlug);
}

export function getPost(seasonSlug: string, postSlug: string): Post | null {
  const filePath = path.join(CONTENT_DIR, seasonSlug, `${postSlug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const source = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(source);

  return {
    slug: postSlug,
    title: data.title,
    episode: data.episode,
    season: data.season,
    seasonTitle: data.seasonTitle,
    series: data.series,
    description: data.description,
    date: data.date,
    linkedInUrl: data.linkedInUrl || "",
    tags: data.tags || [],
    slides: data.slides || 0,
    slideData: data.slideData || [],
    slideImages: data.slideImages || [],
    status: data.status || "draft",
    content,
  };
}

export function getSeasons(): (Season & { postCount: number })[] {
  const allPosts = getAllPosts();
  return seasons.map((s) => ({
    ...s,
    postCount: allPosts.filter((p) => p.season === s.slug).length,
  }));
}

export function getAllPostSlugs(): { season: string; slug: string }[] {
  return getAllPosts().map((p) => ({
    season: p.season,
    slug: p.slug,
  }));
}
