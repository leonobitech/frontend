import { blogPosts, type BlogPost } from "@/data/blog";
import { resolveImage, resolveImages } from "../shared/image-service";

function getBlogFallback(post: BlogPost): string {
  if (post.coverImage && post.coverImage.trim().length > 0) {
    return post.coverImage;
  }
  // Default fallback based on category
  const categoryImages: Record<string, string> = {
    Rust: "/placeholder-rust.png",
    Architecture: "/placeholder-architecture.png",
    Database: "/placeholder-database.png",
  };
  return categoryImages[post.category] || "/placeholder.svg";
}

export async function resolveBlogImage(post: BlogPost): Promise<string> {
  const fallback = getBlogFallback(post);
  return resolveImage(post, fallback);
}

export async function enrichBlogPosts(posts: BlogPost[]): Promise<BlogPost[]> {
  return Promise.all(
    posts.map(async (post) => ({
      ...post,
      coverImage: await resolveBlogImage(post),
    }))
  );
}

export function findBlogPostById(id: string): BlogPost | undefined {
  return blogPosts.find((post) => post.id === id);
}
