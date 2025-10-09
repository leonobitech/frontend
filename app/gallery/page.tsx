import { Suspense } from "react";
import { Metadata } from "next";
import GalleryGrid from "./components/GalleryGrid";
import GalleryHero from "./components/GalleryHero";
import GalleryFilter from "./components/GalleryFilter";
import GalleryShowcase from "./components/GalleryShowcase";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export const metadata: Metadata = {
  title: "Gallery | Leonobitech",
  description:
    "Explore our gallery of MCP-powered applications, prototypes, and LinkedIn showcases.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function GalleryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <GalleryHero />
      <section className="mb-12">
        <Suspense fallback={<LoadingSpinner />}>
          <GalleryShowcase />
        </Suspense>
      </section>
      <Suspense fallback={<LoadingSpinner />}>
        <GalleryFilter />
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">
            All Gallery Entries
          </h2>
          <GalleryGrid />
        </section>
      </Suspense>
    </div>
  );
}
