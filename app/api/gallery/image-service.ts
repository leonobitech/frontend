import { galleryItems, type GalleryItem } from "@/data/gallery";
import { resolveImage, resolveImages } from "../shared/image-service";

export async function resolveGalleryImage(entry: GalleryItem): Promise<string> {
  return resolveImage(entry, "/placeholder.svg");
}

export async function enrichGalleryItems(items: GalleryItem[]) {
  return resolveImages(items, "/placeholder.svg");
}

export function findGalleryItemById(id: string) {
  return galleryItems.find((item) => item.id === id);
}
