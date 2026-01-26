"use client";

import React, { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import GalleryCard from "./GalleryCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import type { GalleryItem } from "@/data/gallery";

type GalleryEntry = GalleryItem & { coverImage: string };

interface ApiResponse {
  entries: GalleryEntry[];
  nextCursor: number | undefined;
}

const fetchGalleryEntries = async ({
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
  const res = await fetch(`/api/gallery?${params.toString()}`);
  if (!res.ok) {
    throw new Error(
      res.status === 500
        ? `${res.status} ${res.statusText}`
        : "You have exceeded the request limit. Please try again later."
    );
  }
  return res.json();
};

export default function GalleryGrid() {
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
    queryKey: ["gallery", category],
    queryFn: ({ pageParam }) => fetchGalleryEntries({ pageParam, category }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
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
    <section aria-label="Gallery entries">
      {status === "pending" ? (
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading gallery...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.pages.map((page, i) => (
              <React.Fragment key={i}>
                {page.entries.map((entry) => (
                  <GalleryCard key={entry.id} entry={entry} />
                ))}
              </React.Fragment>
            ))}
          </div>
          <div ref={ref} className="flex justify-center mt-8">
            {isFetchingNextPage ? (
              <div className="flex flex-col items-center">
                <LoadingSpinner />
                <p className="mt-2 text-gray-600">Loading more entries...</p>
              </div>
            ) : hasNextPage ? (
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                aria-label="Load more gallery entries"
                className="bg-linear-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
               dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
                hover:shadow-lg hover:scale-105 
                transition-all duration-300 ease-out
                text-white font-semibold w-48"
              >
                See More
              </Button>
            ) : (
              <p className="text-gray-600">There are no more entries yet.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
