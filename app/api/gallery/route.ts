import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { galleryItems } from "@/data/gallery";
import { enrichGalleryItems } from "./image-service";

const DEFAULT_LIMIT = 9;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.max(
    parseInt(searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10),
    1
  );
  const category = searchParams.get("category");

  const normalizedCategory = category && category !== "All" ? category : null;

  const filteredItems = normalizedCategory
    ? galleryItems.filter((item) => item.category === normalizedCategory)
    : galleryItems;

  const start = (page - 1) * limit;
  const paginatedItems = filteredItems.slice(start, start + limit);
  const hasMore = start + limit < filteredItems.length;

  const entriesWithImages = await enrichGalleryItems(paginatedItems);

  return NextResponse.json({
    entries: entriesWithImages,
    nextCursor: hasMore ? page + 1 : undefined,
  });
}
