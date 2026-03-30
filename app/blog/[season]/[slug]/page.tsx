import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getAllPostSlugs } from "@/lib/blog";
import { getSeasonBySlug } from "@/content/blog/seasons";
import { ArrowLeft, Calendar, Layers, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/blog/JsonLd";
import { SlideCarousel } from "@/components/blog/SlideCarousel";

interface Props {
  params: Promise<{ season: string; slug: string }>;
}

export async function generateStaticParams() {
  return getAllPostSlugs().map(({ season, slug }) => ({ season, slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season, slug } = await params;
  const post = getPost(season, slug);
  if (!post) return {};

  return {
    title: `${post.title} — Knowing Claude over Coffee | Leonobitech`,
    description: post.description,
    keywords: post.tags,
    openGraph: {
      title: `EP${String(post.episode).padStart(2, "0")}: ${post.title}`,
      description: post.description,
      type: "article",
      url: `https://leonobitech.com/blog/${season}/${slug}`,
      siteName: "Leonobitech",
      publishedTime: post.date,
      authors: ["Leonobitech"],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — Knowing Claude over Coffee`,
      description: post.description,
    },
  };
}

export default async function EpisodePage({ params }: Props) {
  const { season: seasonSlug, slug } = await params;
  const post = getPost(seasonSlug, slug);
  if (!post) notFound();

  const season = getSeasonBySlug(seasonSlug);

  return (
    <div className="min-h-screen">
      {/* ─── Header ─── */}
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-6">
          {/* Breadcrumb */}
          <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <Link href="/blog" className="transition-colors hover:text-[#3A3A3A] dark:hover:text-[#D1D5DB]">
              Blog
            </Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <Link href={`/blog/${seasonSlug}`} className="transition-colors hover:text-[#3A3A3A] dark:hover:text-[#D1D5DB]">
              {season?.title || seasonSlug}
            </Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-[#3A3A3A] dark:text-[#D1D5DB]">
              EP{String(post.episode).padStart(2, "0")}
            </span>
          </nav>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E91E63]">
              Episode {String(post.episode).padStart(2, "0")}
            </span>
            <span className="inline-flex rounded-full bg-[#f59e0b]/10 px-3 py-0.5 text-xs font-semibold text-[#f59e0b]">
              {post.seasonTitle}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB] sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            {post.description}
          </p>

          {/* Date & slides */}
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              {post.slides} slides
            </span>
          </div>
        </div>
      </div>

      {/* ─── Carousel ─── */}
      {post.slideData.length > 0 && (
        <div className="py-10 sm:py-14">
          <div className="mx-auto max-w-4xl px-6">
            <SlideCarousel
              slides={post.slideData}
              episode={`Episode ${String(post.episode).padStart(2, "0")}`}
            />
          </div>
        </div>
      )}

      {/* ─── Summary (SEO) ─── */}
      <section className="bg-gray-50 dark:bg-white/3 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-2xl font-bold tracking-tight text-[#3A3A3A] dark:text-[#D1D5DB]">
            Episode Summary
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 dark:text-gray-400">
            {post.description}
          </p>

          {/* Key points */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {post.slideData
              .filter((s) => s.type === "content" && s.coffeeTip)
              .map((slide, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-[#C8CCD1] dark:bg-[#4A4A4A] p-5 transition-all hover:shadow-lg hover:shadow-gray-300/40 dark:hover:shadow-black/20"
                >
                  <h3 className="text-sm font-semibold text-[#2B2B2B] dark:text-[#D1D5DB]">
                    {slide.title.replace(/\*\*/g, "")}
                  </h3>
                  {slide.coffeeTip && (
                    <p className="mt-2 text-sm leading-relaxed text-[#4A4A4A] dark:text-[#a8a29e]">
                      {slide.coffeeTip}
                    </p>
                  )}
                </div>
              ))}
          </div>

          {/* Tags */}
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#f59e0b]/10 px-3 py-1 text-xs font-medium text-[#f59e0b]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Navigation ─── */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-between">
          <Link
            href={`/blog/${seasonSlug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500 transition-colors hover:text-[#3A3A3A] dark:hover:text-[#D1D5DB]"
          >
            <ArrowLeft className="h-4 w-4" />
            All episodes
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500 transition-colors hover:text-[#3A3A3A] dark:hover:text-[#D1D5DB]"
          >
            All seasons
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: {
            "@type": "Organization",
            name: "Leonobitech",
            url: "https://leonobitech.com",
          },
          publisher: {
            "@type": "Organization",
            name: "Leonobitech",
            url: "https://leonobitech.com",
          },
          url: `https://leonobitech.com/blog/${seasonSlug}/${slug}`,
          keywords: post.tags.join(", "),
          isPartOf: {
            "@type": "Blog",
            name: "Knowing Claude over Coffee",
            url: "https://leonobitech.com/blog",
          },
        }}
      />
    </div>
  );
}
