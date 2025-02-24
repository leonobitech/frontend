import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoriteCourse = {
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
  favoriteCourses: FavoriteCourse[];
  favoriteProjects: FavoriteProject[];
  favoritePodcasts: FavoritePodcast[];
  addFavoriteCourse: (course: FavoriteCourse) => void;
  removeFavoriteCourse: (id: string) => void;
  addFavoriteProject: (project: FavoriteProject) => void;
  removeFavoriteProject: (id: string) => void;
  addFavoritePodcast: (podcast: FavoritePodcast) => void;
  removeFavoritePodcast: (id: string) => void;
};

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set) => ({
      favoriteCourses: [],
      favoriteProjects: [],
      favoritePodcasts: [],
      addFavoriteCourse: (course) =>
        set((state) => ({
          favoriteCourses: [...state.favoriteCourses, course],
        })),
      removeFavoriteCourse: (id) =>
        set((state) => ({
          favoriteCourses: state.favoriteCourses.filter((c) => c.id !== id),
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
