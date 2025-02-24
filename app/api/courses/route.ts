import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NodeCache from "node-cache";

// Crear una instancia de caché
const cache = new NodeCache({ stdTTL: 3600 }); // Caché durante 1 hora

// Simulamos una base de datos de cursos
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
  category: ["AI Agents", "AI Ethics", "GenAI", "MLOps"][
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "9", 10);
  const category = searchParams.get("category");

  let filteredCourses = courses;
  if (category && category !== "All") {
    filteredCourses = courses.filter((course) => course.category === category);
  }

  const start = (page - 1) * limit;
  const end = start + limit;

  const paginatedCourses = filteredCourses.slice(start, end);
  const hasMore = end < filteredCourses.length;

  // Obtener imágenes solo para los cursos que no tienen una imagen
  const coursesWithImages = await Promise.all(
    paginatedCourses.map(async (course) => {
      if (!course.image) {
        course.image = await getUnsplashImage(course.category);
      }
      return course;
    })
  );

  return NextResponse.json({
    courses: coursesWithImages,
    nextCursor: hasMore ? page + 1 : undefined,
  });
}
