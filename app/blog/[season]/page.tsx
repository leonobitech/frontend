import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsBySeason } from "@/lib/blog";
import { getSeasonBySlug, seasons } from "@/content/blog/seasons";
import { ArrowLeft, ArrowRight, Coffee } from "lucide-react";
import { JsonLd } from "@/components/blog/JsonLd";

interface Props {
  params: Promise<{ season: string }>;
}

export async function generateStaticParams() {
  return seasons
    .filter((s) => s.status !== "upcoming" || getPostsBySeason(s.slug).length > 0)
    .map((s) => ({ season: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season: seasonSlug } = await params;
  const season = getSeasonBySlug(seasonSlug);
  if (!season) return {};

  return {
    title: `${season.title} — Knowing Claude over Coffee | Leonobitech`,
    description: season.description,
    openGraph: {
      title: `${season.title} — Knowing Claude over Coffee ☕`,
      description: season.description,
      url: `https://leonobitech.com/blog/${seasonSlug}`,
      siteName: "Leonobitech",
      type: "website",
    },
  };
}

export default async function SeasonPage({ params }: Props) {
  const { season: seasonSlug } = await params;
  const season = getSeasonBySlug(seasonSlug);
  if (!season) notFound();

  const posts = getPostsBySeason(seasonSlug);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        {/* Back */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 transition-colors hover:text-[#3A3A3A] dark:hover:text-[#D1D5DB]"
        >
          <ArrowLeft className="h-4 w-4" />
          All seasons
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E91E63]">
              Season {season.order}
            </span>
            <span className="inline-flex rounded-full bg-[#f59e0b]/10 px-3 py-0.5 text-xs font-semibold text-[#f59e0b]">
              {season.course}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#3A3A3A] dark:text-[#D1D5DB] sm:text-5xl">
            {season.title}
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            {season.description}
          </p>
        </div>

        {/* Episodes */}
        {posts.length > 0 ? (
          <section className="bg-gray-50 dark:bg-white/3 -mx-6 px-6 py-10 sm:-mx-10 sm:px-10 sm:py-12 rounded-lg">
            <div className="space-y-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${seasonSlug}/${post.slug}`}
                  className="group block rounded-lg bg-[#C8CCD1] dark:bg-[#4A4A4A] p-5 transition-all hover:shadow-lg hover:shadow-gray-300/40 dark:hover:shadow-black/20 sm:p-6"
                >
                  {/* Top row: episode label + metadata */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#E91E63]">
                        Episode {String(post.episode).padStart(2, "0")}
                      </span>
                      {post.status === "published" && (
                        <span className="inline-flex rounded-full bg-[#f59e0b]/10 px-3 py-0.5 text-xs font-semibold text-[#f59e0b]">
                          Published
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#4A4A4A]/40 dark:text-[#a8a29e]/40 transition-transform group-hover:translate-x-1 group-hover:text-[#2B2B2B] dark:group-hover:text-[#D1D5DB]" />
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-bold text-[#2B2B2B] dark:text-[#D1D5DB]">
                    {post.title}
                  </h2>

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
          </section>
        ) : (
          <div className="rounded-lg bg-gray-50 dark:bg-white/3 p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500">
              Episodes coming soon. Stay tuned!
            </p>
          </div>
        )}
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${season.title} — Knowing Claude over Coffee`,
          description: season.description,
          url: `https://leonobitech.com/blog/${seasonSlug}`,
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
