"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedCourse {
  id: string;
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
  const {
    data: featuredCourses,
    error,
    isLoading,
  } = useQuery<FeaturedCourse[], Error>({
    queryKey: ["featuredCourses"],
    queryFn: fetchFeaturedCourses,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3, // Retry failed requests 3 times
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const nextSlide = useCallback(() => {
    if (featuredCourses) {
      setCurrentIndex((prevIndex) =>
        prevIndex === featuredCourses.length - 1 ? 0 : prevIndex + 1
      );
    }
  }, [featuredCourses]);

  const prevSlide = useCallback(() => {
    if (featuredCourses) {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? featuredCourses.length - 1 : prevIndex - 1
      );
    }
  }, [featuredCourses]);

  const handleTouchEnd = useCallback(() => {
    if (touchStart - touchEnd > 75) {
      nextSlide();
    }

    if (touchStart - touchEnd < -75) {
      prevSlide();
    }
  }, [touchStart, touchEnd, nextSlide, prevSlide]);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [nextSlide]);

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
        className="bg-red-100 border-l-4 border-red-500  p-4 my-4"
      >
        <p className="text-red-700 font-bold">Error</p>
        <p>{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }

  if (!featuredCourses || featuredCourses.length === 0) {
    return (
      <div className="text-center p-4">
        <p>There are no featured courses available at this time.</p>
      </div>
    );
  }

  return (
    <section aria-label="Featured Courses" className="my-4 sm:my-8">
      <div className="relative">
        <div
          className="overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex transition-transform duration-300 ease-in-out ${
              currentIndex === 0
                ? "translate-x-0"
                : currentIndex === 1
                ? "-translate-x-100"
                : currentIndex === 2
                ? "-translate-x-200"
                : currentIndex === 3
                ? "-translate-x-300"
                : "-translate-x-400"
            }`}
          >
            {featuredCourses.map((course: FeaturedCourse) => (
              <div key={course.id} className="w-full flex-shrink-0 px-2">
                <Card className="h-full">
                  <CardContent className="p-0">
                    <Link
                      href={`/courses/${course.id}`}
                      className="block h-full"
                    >
                      <div className="relative h-40 sm:h-48 md:h-56">
                        <Image
                          src={course.image}
                          alt={course.title}
                          fill={true}
                          priority={true}
                          className="object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      {/* TODO: Improve Banner */}
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        <Button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 p-1 sm:p-2 hidden sm:flex"
          aria-label="Curso anterior"
        >
          <ChevronLeft className="h-4 w-4 " />
        </Button>
        <Button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 p-1 sm:p-2 hidden sm:flex"
          aria-label="Siguiente curso"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-center mt-4">
        {featuredCourses.map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full mx-1 ${
              index === currentIndex ? "bg-blue-500" : "bg-gray-300"
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir al curso ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
