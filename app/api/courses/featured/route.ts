import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NodeCache from "node-cache";

// Create a cache instance
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Import the courses array from the main route
const courses = Array.from({ length: 50 }, (_, i) => ({
  id: `course-${i + 1}`,
  title: `Course ${i + 1}`,
  description: `This is the description of the Course ${i + 1}`,
  duration: `${Math.floor(Math.random() * 12) + 1} weeks`,
  level: ["Beginner", "Intermediate", "Advanced"][
    Math.floor(Math.random() * 3)
  ],
  modules: Math.floor(Math.random() * 20) + 5,
  price: parseFloat((Math.random() * 100 + 20).toFixed(2)),
  rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
  image: "",
  category: ["AI Agents", "AI", "Edge AI", "Tech"][
    Math.floor(Math.random() * 4)
  ],
  views: Math.floor(Math.random() * 10000) + 100,
  likes: Math.floor(Math.random() * 1000) + 10,
}));

async function getUnsplashImage(query: string): Promise<string> {
  const cacheKey = `unsplash_${query}`;
  const cachedImage = cache.get(cacheKey);

  if (cachedImage) {
    return cachedImage as string;
  }

  const response = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
      query
    )}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch image from Unsplash");
  }
  const data = await response.json();
  const imageUrl = data.urls.regular;

  cache.set(cacheKey, imageUrl);
  return imageUrl;
}

// Function to select featured courses
function selectFeaturedCourses(allCourses: typeof courses, count: number) {
  // For this example, we'll just select the first 'count' courses
  // In a real application, you might want to implement a more sophisticated selection method
  return allCourses.slice(0, count);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get("count") || "5", 10);

  const featuredCourses = selectFeaturedCourses(courses, count);

  // Get images for the featured courses
  const coursesWithImages = await Promise.all(
    featuredCourses.map(async (course) => {
      if (!course.image) {
        course.image = await getUnsplashImage(course.category);
      }
      return course;
    })
  );

  return NextResponse.json({
    courses: coursesWithImages,
  });
}
