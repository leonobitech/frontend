import { Suspense } from "react";
import { Metadata } from "next";
import CoursesGrid from "./components/CoursesGrid";
import CoursesHero from "./components/CoursesHero";
import CoursesFilter from "./components/CoursesFilter";
import FeaturedCourses from "./components/FeaturedCourses";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Discover a wide range of online courses to improve your skills and advance your career.",
};

export default function CoursesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CoursesHero />
      <section className="mb-12">
        <Suspense fallback={<LoadingSpinner />}>
          <FeaturedCourses />
        </Suspense>
      </section>
      <Suspense fallback={<LoadingSpinner />}>
        <CoursesFilter />
        <section>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">
            All Courses
          </h2>
          <CoursesGrid />
        </section>
      </Suspense>
    </div>
  );
}
