// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoriteGalleryEntry = {
  id: string;
  title: string;
};

type FavoriteProject = {
  id: string;
  title: string;
};

type FavoritePodcast = {
  id: string;
  title: string;
};

type FavoriteStore = {
  favoriteGallery: FavoriteGalleryEntry[];
  favoriteProjects: FavoriteProject[];
  favoritePodcasts: FavoritePodcast[];
  addFavoriteGalleryEntry: (entry: FavoriteGalleryEntry) => void;
  removeFavoriteGalleryEntry: (id: string) => void;
  addFavoriteProject: (project: FavoriteProject) => void;
  removeFavoriteProject: (id: string) => void;
  addFavoritePodcast: (podcast: FavoritePodcast) => void;
  removeFavoritePodcast: (id: string) => void;
};

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set) => ({
      favoriteGallery: [],
      favoriteProjects: [],
      favoritePodcasts: [],
      addFavoriteGalleryEntry: (entry) =>
        set((state) => ({
          favoriteGallery: [...state.favoriteGallery, entry],
        })),
      removeFavoriteGalleryEntry: (id) =>
        set((state) => ({
          favoriteGallery: state.favoriteGallery.filter((item) => item.id !== id),
        })),
      addFavoriteProject: (project) =>
        set((state) => ({
          favoriteProjects: [...state.favoriteProjects, project],
        })),
      removeFavoriteProject: (id) =>
        set((state) => ({
          favoriteProjects: state.favoriteProjects.filter((p) => p.id !== id),
        })),
      addFavoritePodcast: (podcast) =>
        set((state) => ({
          favoritePodcasts: [...state.favoritePodcasts, podcast],
        })),
      removeFavoritePodcast: (id) =>
        set((state) => ({
          favoritePodcasts: state.favoritePodcasts.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "favorite-storage",
    }
  )
);
