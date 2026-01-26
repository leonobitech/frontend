"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GalleryItem } from "@/data/gallery";

const fetchFeaturedEntries = async (): Promise<GalleryItem[]> => {
  const res = await fetch("/api/gallery/featured");
  if (!res.ok) {
    throw new Error(
      res.status === 500
        ? `${res.status} ${res.statusText}`
        : "You have exceeded the request limit. Please try again later."
    );
  }
  const data = await res.json();
  return data.entries;
};

export default function GalleryShowcase() {
  const { data, error, isLoading } = useQuery<GalleryItem[], Error>({
    queryKey: ["featuredGallery"],
    queryFn: fetchFeaturedEntries,
    staleTime: 1000 * 60 * 5,
    retry: 3,
  });

  const featuredEntries = useMemo(() => data ?? [], [data]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const canNavigate = featuredEntries.length > 1;

  const scrollToIndex = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    el.scrollTo({ left: i * slideWidth, behavior: "smooth" });
    setCurrentIndex(i);
  }, []);

  const nextSlide = useCallback(() => {
    if (!canNavigate) return;
    setCurrentIndex((prev) => {
      const i = (prev + 1) % featuredEntries.length;
      setTimeout(() => scrollToIndex(i), 0);
      return i;
    });
  }, [canNavigate, featuredEntries.length, scrollToIndex]);

  const prevSlide = useCallback(() => {
    if (!canNavigate) return;
    setCurrentIndex((prev) => {
      const i = (prev - 1 + featuredEntries.length) % featuredEntries.length;
      setTimeout(() => scrollToIndex(i), 0);
      return i;
    });
  }, [canNavigate, featuredEntries.length, scrollToIndex]);

  useEffect(() => {
    if (!canNavigate) return;
    const t = setInterval(nextSlide, 5000);
    return () => clearInterval(t);
  }, [canNavigate, nextSlide]);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    const i = Math.round(el.scrollLeft / slideWidth);
    if (i !== currentIndex) setCurrentIndex(i);
  }, [currentIndex]);

  useEffect(() => {
    const onResize = () => scrollToIndex(currentIndex);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [currentIndex, scrollToIndex]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading featured experiments...</p>
      </div>
    );
  }

  if (error) {
    console.error("Error API fetch:", error);
    return (
      <div
        role="alert"
        className="bg-red-100 border-l-4 border-red-500 p-4 my-4"
      >
        <p className="text-red-700 font-bold">Error</p>
        <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }

  if (featuredEntries.length === 0) {
    return (
      <div className="text-center p-4">
        <p>We are still curating the first MCP drops. Check back soon.</p>
      </div>
    );
  }

  return (
    <section aria-label="Featured gallery entries" className="my-4 sm:my-8">
      <div className="relative mx-auto max-w-6xl px-3 sm:px-4">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-linear-to-r from-indigo-900/10 via-blue-500/10 to-purple-500/10 blur-3xl" />
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="overflow-x-hidden touch-pan-y scroll-smooth rounded-3xl ring-1 ring-white/10 backdrop-blur"
          aria-live="polite"
        >
          <div className="flex w-full snap-x snap-mandatory">
            {featuredEntries.map((entry, i) => (
              <div
                key={`${entry.id}-${i}`}
                className="w-full min-w-full shrink-0 snap-center"
              >
                <div
                  className="relative overflow-hidden rounded-3xl bg-black/30"
                  style={{ height: "clamp(220px, 45vw, 420px)" }}
                >
                  <Image
                    src={entry.coverImage || "/placeholder.svg"}
                    alt={entry.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 896px"
                    loading={i === 0 ? "eager" : "lazy"}
                    className="object-cover object-center"
                    priority={i === 0}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 text-white sm:p-6">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                      {entry.category}
                    </p>
                    <h3 className="text-lg font-semibold leading-snug sm:text-2xl">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-white/80 line-clamp-2 sm:text-base">
                      {entry.summary}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {canNavigate && (
          <>
            <Button
              onClick={prevSlide}
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-transparent/20 text-white transition hover:bg-transparent/40 sm:flex"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6 opacity-70 hover:opacity-100" />
            </Button>
            <Button
              onClick={nextSlide}
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-transparent/20 text-white transition hover:bg-transparent/40 sm:flex"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6 opacity-70 hover:opacity-100" />
            </Button>
          </>
        )}
      </div>

      {canNavigate && (
        <div className="mt-4 flex justify-center gap-2">
          {featuredEntries.map((_, i) => (
            <button
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex
                  ? "w-6 bg-blue-500"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
