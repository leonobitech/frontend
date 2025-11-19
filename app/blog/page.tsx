import { BlogHero } from "@/components/blog/BlogHero";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { PostCard } from "@/components/blog/PostCard";
import type { Metadata } from "next";
import { blogPosts } from "@/data/blog";
import { enrichBlogPosts } from "@/app/api/blog/image-service";

// SEO & Open Graph optimization for LinkedIn
export const metadata: Metadata = {
  title: "Engineering Blog | Leonobitech - Rust, Architecture & System Design",
  description:
    "Deep dives into Rust, system architecture, and building production-grade software. Learn from real-world implementations of microservices, clean architecture, and type-safe systems.",
  openGraph: {
    title: "Engineering Blog | Leonobitech",
    description:
      "Deep dives into Rust, system architecture, and building production-grade software",
    type: "website",
    url: "https://leonobitech.com/blog",
    images: [
      {
        url: "https://leonobitech.com/og-blog.png",
        width: 1200,
        height: 630,
        alt: "Leonobitech Engineering Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering Blog | Leonobitech",
    description: "Deep dives into Rust, architecture, and production systems",
    images: ["https://leonobitech.com/og-blog.png"],
  },
};

export default async function BlogPage() {
  // Enrich posts with Unsplash images
  const enrichedPosts = await enrichBlogPosts(blogPosts);

  // Featured post (first one)
  const featuredPost = enrichedPosts[0];
  // Rest of the posts
  const regularPosts = enrichedPosts.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <BlogHero />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Featured Post */}
        <FeaturedPost post={featuredPost} />

        {/* Section Title */}
        <div className="mb-12">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">
            Latest Articles
          </h2>
          <p className="text-muted-foreground">
            Explore in-depth tutorials and insights on building production
            systems
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {regularPosts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>

        {/* Newsletter CTA (optional - you can add later) */}
        <div className="mt-20 rounded-3xl border border-border/50 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 p-12 text-center backdrop-blur-sm">
          <h3 className="mb-3 text-2xl font-bold">
            Want to dive deeper into Rust?
          </h3>
          <p className="mb-6 text-muted-foreground">
            Follow our journey building production systems with Rust. New
            articles every week.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://linkedin.com/company/leonobitech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
            >
              Follow on LinkedIn
            </a>
            <a
              href="https://github.com/leonobitech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 font-semibold transition-colors hover:bg-muted"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
