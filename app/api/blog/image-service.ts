import NodeCache from "node-cache";
import { blogPosts, type BlogPost } from "@/data/blog";

const imageCache = new NodeCache({ stdTTL: 60 * 60 }); // 1 hour cache

function getFallbackImage(post: BlogPost): string {
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
  const cached = imageCache.get<string>(post.id);
  if (cached) return cached;

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const query = post.unsplashQuery || post.title;

  if (!unsplashKey || !query) {
    const fallback = getFallbackImage(post);
    imageCache.set(post.id, fallback);
    return fallback;
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
        query
      )}&orientation=landscape&client_id=${unsplashKey}`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!res.ok) {
      throw new Error(`Unsplash error ${res.status}`);
    }

    const data = await res.json();
    const imageUrl: string | undefined = data?.urls?.regular;

    if (!imageUrl) {
      throw new Error("Missing image url");
    }

    imageCache.set(post.id, imageUrl, imageCache.options.stdTTL ?? 0);
    return imageUrl;
  } catch (error) {
    console.error("Unsplash fetch failed for", post.id, error);
    const fallback = getFallbackImage(post);
    imageCache.set(post.id, fallback);
    return fallback;
  }
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
