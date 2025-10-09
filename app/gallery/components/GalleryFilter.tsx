"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";

const categories = [
  "All",
  "Agent Apps",
  "SDK Experiments",
  "Workflows",
  "LinkedIn Drops",
];

export default function GalleryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const isMobile = useIsMobile();
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setActiveCategory(category);
    } else {
      setActiveCategory("All");
    }
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const params = new URLSearchParams();
    if (category === "All") {
      router.push("/gallery", { scroll: false });
      return;
    }
    params.set("category", category);
    router.push(`/gallery?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!isMobile) return;
    const el = trackRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLButtonElement>(
      `[data-category="${activeCategory}"]`
    );
    activeEl?.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, [activeCategory, isMobile]);

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Filter Gallery</h2>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 py-1 sm:px-0 sm:flex-wrap sm:justify-center sm:overflow-visible"
        >
          {categories.map((category) => (
            <Button
              key={category}
              data-category={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => handleCategoryChange(category)}
              className="snap-start whitespace-nowrap text-sm sm:mb-2"
              size="default"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
