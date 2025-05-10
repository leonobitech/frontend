"use client";

import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import CourseCard from "./CourseCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  modules: number;
  price: number;
  rating: number;
  image: string;
  category: string;
  views: number;
  likes: number;
}

interface ApiResponse {
  courses: Course[];
  nextCursor: number | undefined;
}

const fetchCourses = async ({
  pageParam = 1,
  category,
}: {
  pageParam?: number;
  category?: string;
}): Promise<ApiResponse> => {
  const params = new URLSearchParams({
    page: pageParam.toString(),
    limit: "9",
  });
  if (category && category !== "All") {
    params.append("category", category);
  }
  const res = await fetch(`/api/courses?${params.toString()}`);
  if (!res.ok) {
    throw new Error(
      res.status === 500
        ? `${res.status} ${res.statusText}`
        : "You have exceeded the request limit. Please try again later."
    );
  }
  return res.json();
};

export default function CoursesGrid() {
  const { ref, isIntersecting } = useIntersectionObserver();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "All";

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["courses", category],
    queryFn: ({ pageParam }) => fetchCourses({ pageParam, category }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 60, // Data remains fresh for 1 hour
    gcTime: 1000 * 60 * 60 * 2, // Data is garbage collected after 2 hours
  });

  useEffect(() => {
    refetch();
  }, [category, refetch]);

  useEffect(() => {
    if (isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, fetchNextPage, hasNextPage]);

  if (status === "error") {
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

  return (
    <section aria-label="Cursos disponibles">
      {status === "pending" ? (
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.pages.map((page, i) => (
              <React.Fragment key={i}>
                {page.courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </React.Fragment>
            ))}
          </div>
          <div ref={ref} className="flex justify-center mt-8">
            {isFetchingNextPage ? (
              <div className="flex flex-col items-center">
                <LoadingSpinner />
                <p className="mt-2 text-gray-600">Loading more courses...</p>
              </div>
            ) : hasNextPage ? (
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                aria-label="Load more courses"
                className="bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
               dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
                hover:shadow-lg hover:scale-105 
                transition-all duration-300 ease-out
                text-white font-semibold w-48"
              >
                See More
              </Button>
            ) : (
              <p className="text-gray-600">
                There are no more courses available
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
