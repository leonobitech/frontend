import { BlogHero } from "@/components/blog/BlogHero";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { PostCard, type Post } from "@/components/blog/PostCard";
import type { Metadata } from "next";

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

// Blog posts data - In production, this would come from a CMS or MDX files
const blogPosts: Post[] = [
  {
    id: "why-rust-for-microservices",
    title: "Why Rust for Mission-Critical Microservices?",
    description:
      "Building core-v2: our auth microservice in Rust. Learn why we chose Rust over TypeScript, Go, and Python for production systems. Complete with code examples, benchmarks, and real-world tradeoffs.",
    date: "2024-11-18",
    readTime: "12 min read",
    image: "/blog/rust-microservices.png",
    category: "Rust",
    tags: ["Rust", "Microservices", "Axum", "Performance"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
  },
  {
    id: "type-safety-parse-dont-validate",
    title: "Type Safety Extremo: Parse, Don't Validate",
    description:
      "How Rust's type system prevents bugs at compile-time. Implementing Email, Password, and UserId value objects that make illegal states unrepresentable. Real code from core-v2.",
    date: "2024-11-19",
    readTime: "10 min read",
    image: "/blog/type-safety.png",
    category: "Rust",
    tags: ["Rust", "Type Safety", "Domain-Driven Design"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
  },
  {
    id: "clean-architecture-rust",
    title: "Clean Architecture in Rust: Beyond the Theory",
    description:
      "Implementing hexagonal architecture with Rust traits. Domain, Application, Infrastructure, and Presentation layers in a real production microservice. No magic, just pure separation of concerns.",
    date: "2024-11-20",
    readTime: "15 min read",
    image: "/blog/clean-architecture.png",
    category: "Architecture",
    tags: ["Architecture", "Rust", "Clean Code", "DDD"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
  },
  {
    id: "sqlx-compile-time-sql",
    title: "SQLx: Compile-Time Verified SQL Queries",
    description:
      "Why we chose SQLx over traditional ORMs. Compile-time SQL verification against your real database schema. Zero runtime surprises, maximum type safety. Complete with migration strategies and testing patterns.",
    date: "2024-11-21",
    readTime: "14 min read",
    image: "/blog/sqlx-database.png",
    category: "Rust",
    tags: ["SQLx", "Database", "Type Safety", "PostgreSQL"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
  },
  {
    id: "error-handling-professional",
    title: "Professional Error Handling in Rust",
    description:
      "Building a robust error hierarchy with thiserror. Domain errors, application errors, and API errors. Error propagation patterns and how to make debugging in production actually pleasant.",
    date: "2024-11-22",
    readTime: "11 min read",
    image: "/blog/error-handling.png",
    category: "Rust",
    tags: ["Error Handling", "Rust", "Best Practices"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
  },
  {
    id: "n8n-scalable-architecture",
    title: "n8n Scalable Architecture with Load Balancing",
    description:
      "Building a highly scalable n8n architecture with Redis, load balancing, and queue workers. Production-ready workflow automation that handles thousands of executions per minute.",
    date: "2024-03-04",
    readTime: "8 min read",
    image: "/post-01.png",
    category: "Architecture",
    tags: ["n8n", "Redis", "Load Balancing", "Automation"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
  },
];

export default function BlogPage() {
  // Featured post (first one)
  const featuredPost = blogPosts[0];
  // Rest of the posts
  const regularPosts = blogPosts.slice(1);

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
