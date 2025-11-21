import NodeCache from "node-cache";

const imageCache = new NodeCache({ stdTTL: 60 * 60 }); // 1 hour cache shared across all services

interface ImageResolvable {
  id: string;
  unsplashQuery?: string;
  title: string;
  coverImage?: string;
}

function getFallbackImage(item: ImageResolvable, defaultFallback = "/placeholder.svg"): string {
  if (item.coverImage && item.coverImage.trim().length > 0) {
    return item.coverImage;
  }
  return defaultFallback;
}

export async function resolveImage(
  item: ImageResolvable,
  defaultFallback?: string
): Promise<string> {
  // Check cache first
  const cached = imageCache.get<string>(item.id);
  if (cached) {
    console.log(`[Image] Using cached image for ${item.id}: ${cached.substring(0, 50)}...`);
    return cached;
  }

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const query = item.unsplashQuery || item.title;

  console.log(`[Image] Resolving image for ${item.id}`, {
    hasKey: !!unsplashKey,
    query,
  });

  // If no key or query, use fallback immediately
  if (!unsplashKey || !query) {
    console.log(`[Image] Missing key or query for ${item.id}, using fallback`);
    const fallback = getFallbackImage(item, defaultFallback);
    imageCache.set(item.id, fallback);
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

    console.log(`[Image] ✓ Unsplash image fetched for ${item.id}: ${imageUrl.substring(0, 50)}...`);
    imageCache.set(item.id, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error(`[Image] ✗ Unsplash fetch failed for ${item.id}:`, error);
    const fallback = getFallbackImage(item, defaultFallback);
    imageCache.set(item.id, fallback);
    return fallback;
  }
}

export async function resolveImages<T extends ImageResolvable>(
  items: T[],
  defaultFallback?: string
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      coverImage: await resolveImage(item, defaultFallback),
    }))
  );
}
