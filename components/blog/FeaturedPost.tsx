"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/data/blog";

interface FeaturedPostProps {
  post: BlogPost;
}

export function FeaturedPost({ post }: FeaturedPostProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative mb-16"
    >
      <Link href={`/blog/${post.id}`}>
        {/* Container with gradient border */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-transparent bg-linear-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 p-0.5 transition-all duration-500 hover:from-purple-500/40 hover:via-pink-500/40 hover:to-blue-500/40">
          {/* Inner card */}
          <div className="relative h-full overflow-hidden rounded-3xl bg-card">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Image side */}
              <div className="relative aspect-16/10 overflow-hidden lg:aspect-auto">
                <Image
                  src={post.coverImage || "/placeholder.svg"}
                  alt={post.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-br from-purple-900/50 via-transparent to-blue-900/50" />

                {/* Featured badge */}
                <div className="absolute left-6 top-6">
                  <Badge className="border-none bg-linear-to-r from-purple-500 to-pink-500 text-white">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Featured
                  </Badge>
                </div>
              </div>

              {/* Content side */}
              <div className="flex flex-col justify-center p-8 lg:p-12">
                {/* Category */}
                <Badge
                  variant="outline"
                  className="mb-4 w-fit border-purple-500/50 text-purple-500"
                >
                  {post.category}
                </Badge>

                {/* Title */}
                <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  <span className="bg-linear-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                    {post.title}
                  </span>
                </h2>

                {/* Description */}
                <p className="mb-6 text-base text-muted-foreground sm:text-lg">
                  {post.description}
                </p>

                {/* Meta */}
                <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </span>
                </div>

                {/* Tags */}
                <div className="mb-8 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-base font-semibold text-purple-500">
                  <span>Read full article</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute -inset-0.5 -z-10 rounded-3xl bg-linear-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      </Link>
    </motion.article>
  );
}
