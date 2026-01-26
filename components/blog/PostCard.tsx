"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/data/blog";

interface PostCardProps {
  post: BlogPost;
  index: number;
}

export function PostCard({ post, index }: PostCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative"
    >
      <Link href={`/blog/${post.id}`} className="block">
        {/* Card wrapper with glassmorphism */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/80 hover:shadow-2xl hover:shadow-purple-500/10">
          {/* Image container */}
          <div className="relative aspect-video overflow-hidden bg-muted">
            <Image
              src={post.coverImage || "/placeholder.svg"}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Category badge on image */}
            <div className="absolute left-4 top-4">
              <Badge
                variant="secondary"
                className="border-none bg-background/90 backdrop-blur-sm"
              >
                {post.category}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Meta info */}
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            </div>

            {/* Title */}
            <h3 className="mb-2 text-xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-purple-500">
              {post.title}
            </h3>

            {/* Description */}
            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
              {post.description}
            </p>

            {/* Tags */}
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Read more link with arrow */}
            <div className="flex items-center gap-2 text-sm font-medium text-purple-500">
              <span>Read article</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>

          {/* Hover glow effect */}
          <div className="absolute -inset-px -z-10 rounded-2xl bg-linear-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        </div>
      </Link>
    </motion.article>
  );
}
