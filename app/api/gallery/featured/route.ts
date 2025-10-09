import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { featuredGalleryIds, galleryItems } from "@/data/gallery";
import { enrichGalleryItems } from "../image-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const count = Math.max(parseInt(searchParams.get("count") || "5", 10), 1);

  const featuredEntries = featuredGalleryIds
    .map((id) => galleryItems.find((item) => item.id === id))
    .filter((item): item is (typeof galleryItems)[number] => Boolean(item))
    .slice(0, count);

  const entriesWithImages = await enrichGalleryItems(featuredEntries);

  return NextResponse.json({
    entries: entriesWithImages,
  });
}
