// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppStore = Record<string, never>;

export const useAppStore = create<AppStore>()(
  persist(
    () => ({}),
    {
      name: "app-storage",
    }
  )
);
