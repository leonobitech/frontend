import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { findBlogPostById } from "@/data/blog";
import { resolveBlogImage } from "@/app/api/blog/image-service";
import { getMarkdownContent } from "@/lib/markdown";
import { MarkdownContent } from "@/components/blog/MarkdownContent";
import { ShareButtons } from "@/components/blog/ShareButtons";

interface BlogPostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = findBlogPostById(id);

  if (!post) {
    return {
      title: "Post Not Found | Leonobitech",
    };
  }

  return {
    title: `${post.title} | Leonobitech Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params;
  const post = findBlogPostById(id);

  if (!post) {
    notFound();
  }

  // Resolve the image from Unsplash or use fallback
  const coverImage = await resolveBlogImage(post);

  // Load markdown content if available
  const markdownData = post.content
    ? await getMarkdownContent(post.content)
    : null;

  return (
    <div className="min-h-screen">
      {/* Header with back button */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link href="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero section with image */}
      <div className="relative h-[400px] w-full overflow-hidden bg-muted">
        <Image
          src={coverImage}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Floating badge */}
        <div className="absolute left-1/2 top-8 -translate-x-1/2">
          <Badge className="border-none bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            {post.category}
          </Badge>
        </div>
      </div>

      {/* Article container - Single continuous card like Canva/ChatGPT documents */}
      <article className="container mx-auto px-4 pb-20">
        {/* Single unified card containing header + content */}
        <div className="relative -mt-32 mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border/50 bg-card/95 backdrop-blur-sm shadow-2xl">
            {/* Card Header */}
            <div className="border-b border-border/20 p-8 sm:p-12">
              {/* Meta info */}
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  By {post.author.name}
                </span>
              </div>

              {/* Title */}
              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-neutral-100 sm:text-5xl">
                {post.title}
              </h1>

              {/* Description */}
              <p className="mb-8 text-lg leading-relaxed text-neutral-300">
                {post.description}
              </p>

              {/* Tags */}
              <div className="mb-8 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Share buttons */}
              <ShareButtons postId={post.id} postTitle={post.title} />
            </div>

            {/* Card Content - Markdown rendered inside the same card */}
            <div className="p-8 sm:p-12">
              {markdownData ? (
                <MarkdownContent content={markdownData.content} />
              ) : (
                <div className="rounded-2xl border border-border/50 bg-muted/30 p-12 text-center">
                  <h2 className="mb-4 text-2xl font-bold">Content Coming Soon</h2>
                  <p className="text-muted-foreground">
                    This article is being written. Check back soon!
                  </p>
                </div>
              )}
            </div>

            {/* Card Footer - Related posts */}
            <div className="border-t border-border/20 p-8 sm:p-12">
              <h2 className="mb-8 text-2xl font-bold">Continue Reading</h2>
              <Link href="/blog">
                <Button
                  variant="outline"
                  className="group w-full sm:w-auto"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  View All Articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
