"use client";

import { useMemo } from "react";
import GalleryCard from "./GalleryCard";
import { useFavoriteStore } from "@/lib/store";
import { galleryItems, type GalleryItem } from "@/data/gallery";

type GalleryEntry = GalleryItem & { coverImage: string };

export default function SavedGallery() {
  const { favoriteGallery } = useFavoriteStore();

  const savedEntries = useMemo(
    () =>
      favoriteGallery
        .map((fav) => galleryItems.find((entry) => entry.id === fav.id))
        .filter(
          (entry): entry is GalleryEntry =>
            Boolean(entry && entry.coverImage && entry.coverImage.length > 0)
        ),
    [favoriteGallery]
  );

  if (savedEntries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">No saved drops yet</p>
        <p className="mt-2 text-sm">
          Guarda tus experimentos favoritos desde la galería para verlos aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {savedEntries.map((entry) => (
        <GalleryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
