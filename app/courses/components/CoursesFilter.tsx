"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

const categories = ["All", "AI Agents", "AI Ethics", "GenAI", "MLOps"];

export default function CoursesFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setActiveCategory(category);
    }
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === "All") {
      router.push("/courses");
    } else {
      router.push(`/courses?category=${encodeURIComponent(category)}`);
    }
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Filter Courses</h2>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            onClick={() => handleCategoryChange(category)}
            className="mb-2 text-sm"
            size="default"
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
