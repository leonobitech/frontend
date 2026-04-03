import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getSeasons } from "@/lib/blog";
import { Coffee, BookOpen, ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/blog/JsonLd";
import { PixelCrab } from "@/components/blog/PixelCrab";

export const metadata: Metadata = {
  title: "Knowing Claude over Coffee ☕ | Leonobitech Blog",
  description:
    "A learning series documenting the journey through Anthropic Academy. Each episode breaks down Claude's ecosystem in a visual, approachable format.",
  openGraph: {
    title: "Knowing Claude over Coffee ☕",
    description:
      "Learn about Claude & Anthropic through visual, approachable episodes. From Claude 101 to Agent Teams.",
    type: "website",
    url: "https://www.leonobitech.com/blog",
    siteName: "Leonobitech",
    images: [
      {
        url: "https://www.leonobitech.com/opengraph-blog.png",
        width: 1200,
        height: 630,
        alt: "Blog Leonobitech — Knowing Claude over Coffee",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Knowing Claude over Coffee ☕",
    description:
      "Learn about Claude & Anthropic through visual, approachable episodes.",
    images: ["https://www.leonobitech.com/opengraph-blog.png"],
  },
};

const statusColors: Record<string, string> = {
  active: "bg-[#f59e0b]/10 text-[#f59e0b]",
  upcoming: "bg-white/5 text-gray-400 dark:text-gray-500",
  completed: "bg-[#f59e0b]/10 text-[#f59e0b]",
};

const statusLabels: Record<string, string> = {
  active: "In Progress",
  upcoming: "Coming Soon",
  completed: "Completed",
};

const postStatusColors: Record<string, string> = {
  published: "text-emerald-600 dark:text-emerald-400",
  draft: "text-gray-400 dark:text-gray-500",
};

export default function BlogPage() {
  const seasons = getSeasons();
  const allPosts = getAllPosts();
  const publishedCount = allPosts.filter(
    (p) => p.status === "published"
  ).length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 flex flex-col items-center gap-4">
            <PixelCrab size={8} />
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f59e0b]/10 px-4 py-2 text-sm font-medium text-[#f59e0b]">
              <Coffee className="h-4 w-4" />
              <span>A LinkedIn Carousel Series</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Knowing Claude
            <br />
            <span className="text-[#E91E63]">over Coffee</span>{" "}
            <span className="text-4xl sm:text-5xl">☕</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Documenting the journey through{" "}
            <span className="font-semibold text-foreground">
              Anthropic Academy
            </span>
            . Each episode breaks down Claude&apos;s ecosystem — visual,
            approachable, and useful.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {seasons.length} courses
            </span>
            <span className="text-border">|</span>
            <span>{publishedCount} episodes published</span>
            <span className="text-border">|</span>
            <span>English</span>
          </div>
        </div>
      </section>

      {/* Seasons */}
      <section className="bg-gray-50 dark:bg-white/3 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-10 text-2xl font-bold text-[#3A3A3A] dark:text-[#D1D5DB]">
            Course Seasons
          </h2>
          <div className="grid gap-4">
            {seasons.map((season) => {
              const seasonPosts = allPosts.filter(
                (p) => p.season === season.slug
              );
              const hasContent = seasonPosts.length > 0;

              return (
                <div key={season.slug}>
                  {hasContent ? (
                    <Link
                      href={`/blog/${season.slug}`}
                      className="group block rounded-lg bg-[#C8CCD1] dark:bg-[#4A4A4A] p-6 transition-all hover:shadow-lg hover:shadow-gray-300/40 dark:hover:shadow-black/20 sm:p-7"
                    >
                      <SeasonContent
                        season={season}
                        posts={seasonPosts}
                        hasContent={hasContent}
                        isActive
                      />
                    </Link>
                  ) : (
                    <div className="rounded-lg bg-gray-200/40 dark:bg-[#3A3A3A] p-6 sm:p-7">
                      <SeasonContent
                        season={season}
                        posts={seasonPosts}
                        hasContent={hasContent}
                        isActive={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Episodes */}
      {publishedCount > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-10 text-2xl font-bold text-[#3A3A3A] dark:text-[#D1D5DB]">
              Latest Episodes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allPosts
                .filter((p) => p.status === "published")
                .slice(0, 6)
                .map((post) => (
                  <Link
                    key={`${post.season}-${post.slug}`}
                    href={`/blog/${post.season}/${post.slug}`}
                    className="group rounded-lg bg-white dark:bg-white/5 p-5 transition-all hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none"
                  >
                    {/* Top row */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#E91E63]">
                          EP{String(post.episode).padStart(2, "0")}
                        </span>
                        <span className="inline-flex rounded-full bg-[#f59e0b]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#f59e0b]">
                          {post.seasonTitle}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#a8a29e]/30 transition-transform group-hover:translate-x-1 group-hover:text-[#D1D5DB]" />
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-[#2B2B2B] dark:text-[#D1D5DB]">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm text-[#4A4A4A] dark:text-[#a8a29e] line-clamp-2">
                      {post.description}
                    </p>

                    {/* Meta */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-[#4A4A4A]/50 dark:text-[#a8a29e]/50">
                      <span>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span>{post.slides} slides</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Knowing Claude over Coffee",
          description:
            "A learning series documenting the journey through Anthropic Academy.",
          url: "https://leonobitech.com/blog",
          publisher: {
            "@type": "Organization",
            name: "Leonobitech",
            url: "https://leonobitech.com",
          },
        }}
      />
    </div>
  );
}

function SeasonContent({
  season,
  posts,
  hasContent,
  isActive,
}: {
  season: ReturnType<typeof getSeasons>[0];
  posts: ReturnType<typeof getAllPosts>;
  hasContent: boolean;
  isActive: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? "text-[#E91E63]" : "text-gray-400 dark:text-gray-500"}`}>
            Season {season.order}
          </span>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusColors[season.status]}`}
          >
            {statusLabels[season.status]}
          </span>
        </div>
        <h3 className={`text-lg font-bold sm:text-xl ${isActive ? "text-[#2B2B2B] dark:text-[#D1D5DB]" : "text-gray-400 dark:text-gray-500"}`}>
          {season.title}
        </h3>
        <p className={`mt-1 text-sm ${isActive ? "text-[#4A4A4A] dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
          {season.description}
        </p>
        {hasContent && (
          <p className="mt-2 text-xs text-[#4A4A4A]/60 dark:text-[#a8a29e]/60">
            {posts.length} episode{posts.length !== 1 ? "s" : ""} published
          </p>
        )}
      </div>
      {hasContent && (
        <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-[#4A4A4A]/50 dark:text-gray-400/50 transition-transform group-hover:translate-x-1 group-hover:text-[#2B2B2B] dark:group-hover:text-[#D1D5DB]" />
      )}
    </div>
  );
}
