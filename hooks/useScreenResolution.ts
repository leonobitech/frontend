// hooks/useScreenResolution.ts
"use client";
export function useScreenResolution() {
  if (typeof window === "undefined") return "0x0"; // SSR-safe
  const { width, height } = window.screen;
  return `${width}x${height}`;
}
