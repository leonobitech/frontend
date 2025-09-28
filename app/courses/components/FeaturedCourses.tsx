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

interface FeaturedCourse {
  title: string;
  description: string;
  image: string;
  category: string;
  duration: string;
  level: string;
  price: number;
}

const fetchFeaturedCourses = async (): Promise<FeaturedCourse[]> => {
  const res = await fetch("/api/courses/featured");
  if (!res.ok) {
    throw new Error(
      res.status === 500
        ? `${res.status} ${res.statusText}`
        : "You have exceeded the request limit. Please try again later."
    );
  }
  const data = await res.json();
  return data.courses;
};

export default function FeaturedCourses() {
  const { data, error, isLoading } = useQuery<FeaturedCourse[], Error>({
    queryKey: ["featuredCourses"],
    queryFn: fetchFeaturedCourses,
    staleTime: 1000 * 60 * 5,
    retry: 3,
  });

  const featuredCourses = useMemo(() => data ?? [], [data]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const canNavigate = featuredCourses.length > 1;

  const scrollToIndex = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth; // cada slide = 100% del track
    el.scrollTo({ left: i * slideWidth, behavior: "smooth" });
    setCurrentIndex(i);
  }, []);

  const nextSlide = useCallback(() => {
    if (!canNavigate) return;
    setCurrentIndex((prev) => {
      const i = (prev + 1) % featuredCourses.length;
      setTimeout(() => scrollToIndex(i), 0);
      return i;
    });
  }, [canNavigate, featuredCourses.length, scrollToIndex]);

  const prevSlide = useCallback(() => {
    if (!canNavigate) return;
    setCurrentIndex((prev) => {
      const i = (prev - 1 + featuredCourses.length) % featuredCourses.length;
      setTimeout(() => scrollToIndex(i), 0);
      return i;
    });
  }, [canNavigate, featuredCourses.length, scrollToIndex]);

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
        <p className="mt-4 text-gray-600">Loading featured courses...</p>
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

  if (featuredCourses.length === 0) {
    return (
      <div className="text-center p-4">
        <p>There are no featured courses available at this time.</p>
      </div>
    );
  }

  return (
    <section aria-label="Featured Courses" className="my-4 sm:my-8">
      <div className="relative max-w-4xl mx-auto px-3 sm:px-4">
        {" "}
        {/* ancho controlado */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="overflow-x-hidden touch-pan-y scroll-smooth"
        >
          <div className="flex w-full snap-x snap-mandatory">
            {featuredCourses.map((course, i) => (
              <div
                key={`${course.title}-${i}`}
                className="w-full min-w-full shrink-0 snap-center" /* ← sin px-2 */
              >
                <div className="w-full min-w-full shrink-0 snap-center">
                  <div className="relative h-56 md:h-64 lg:h-72 rounded-xl overflow-hidden bg-black/30">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      sizes="100vw"
                      className="object-cover object-center"
                      priority
                    />
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
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/75 p-1 sm:p-2 hidden sm:flex"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={nextSlide}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/75 p-1 sm:p-2 hidden sm:flex"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {canNavigate && (
        <div className="flex justify-center mt-4">
          {featuredCourses.map((_, i) => (
            <button
              key={i}
              className={`h-2 w-2 rounded-full mx-1 ${
                i === currentIndex ? "bg-blue-500" : "bg-gray-300"
              }`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
