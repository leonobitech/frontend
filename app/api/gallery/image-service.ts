import NodeCache from "node-cache";
import { galleryItems, type GalleryItem } from "@/data/gallery";

const imageCache = new NodeCache({ stdTTL: 60 * 60 });

function getFallbackImage(entry: GalleryItem) {
  if (entry.coverImage && entry.coverImage.trim().length > 0) {
    return entry.coverImage;
  }
  return "/placeholder.svg";
}

export async function resolveGalleryImage(entry: GalleryItem): Promise<string> {
  const cached = imageCache.get<string>(entry.id);
  if (cached) {
    console.log(`[Gallery] Using cached image for ${entry.id}: ${cached}`);
    return cached;
  }

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const query = entry.unsplashQuery || entry.title;

  console.log(`[Gallery] Resolving image for ${entry.id}`, {
    hasKey: !!unsplashKey,
    query,
  });

  if (!unsplashKey || !query) {
    console.log(`[Gallery] Missing key or query for ${entry.id}, using fallback`);
    const fallback = getFallbackImage(entry);
    imageCache.set(entry.id, fallback);
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

    console.log(`[Gallery] ✓ Unsplash image fetched for ${entry.id}: ${imageUrl}`);
    imageCache.set(entry.id, imageUrl, imageCache.options.stdTTL ?? 0);
    return imageUrl;
  } catch (error) {
    console.error(`[Gallery] ✗ Unsplash fetch failed for ${entry.id}:`, error);
    const fallback = getFallbackImage(entry);
    imageCache.set(entry.id, fallback);
    return fallback;
  }
}

export async function enrichGalleryItems(items: GalleryItem[]) {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      coverImage: await resolveGalleryImage(item),
    }))
  );
}

export function findGalleryItemById(id: string) {
  return galleryItems.find((item) => item.id === id);
}
