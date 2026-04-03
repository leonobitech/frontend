import { Metadata } from "next";
import { JsonLd } from "@/components/blog/JsonLd";
import CourseDetailClient from "./CourseDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://core.leonobitech.com";

async function fetchCourse(slug: string) {
  try {
    const res = await fetch(`${API_URL}/courses/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await fetchCourse(slug);
  if (!course) return { title: "Curso no encontrado — Leonobitech" };

  const totalLessons = course.modules?.reduce(
    (acc: number, m: { lessons: unknown[] }) => acc + m.lessons.length,
    0
  ) || 0;

  const description = course.description.length > 160
    ? course.description.slice(0, 157) + "..."
    : course.description;

  return {
    title: `${course.title} — Cursos | Leonobitech`,
    description,
    keywords: [
      course.title,
      "curso",
      "Anthropic",
      "Claude",
      "IA empresarial",
      "LMS",
    ],
    openGraph: {
      title: course.title,
      description,
      type: "website",
      url: `https://www.leonobitech.com/courses/${slug}`,
      siteName: "Leonobitech",
      images: [
        {
          url: course.thumbnailUrl || "https://www.leonobitech.com/opengraph-courses.png",
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,
      images: [course.thumbnailUrl || "https://www.leonobitech.com/opengraph-courses.png"],
    },
    alternates: {
      canonical: `https://www.leonobitech.com/courses/${slug}`,
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await fetchCourse(slug);

  return (
    <>
      {course && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Course",
            name: course.title,
            description: course.description,
            url: `https://www.leonobitech.com/courses/${slug}`,
            provider: {
              "@type": "Organization",
              name: "Leonobitech",
              url: "https://www.leonobitech.com",
            },
            ...(course.thumbnailUrl
              ? { image: course.thumbnailUrl }
              : {}),
            offers: {
              "@type": "Offer",
              price: course.price,
              priceCurrency: course.currency,
              availability: "https://schema.org/InStock",
              url: `https://www.leonobitech.com/courses/${slug}`,
            },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "Online",
              courseWorkload: (() => {
                const totalSeconds = course.modules?.reduce(
                  (acc: number, m: { lessons: { duration?: number }[] }) =>
                    acc + m.lessons.reduce((a: number, l: { duration?: number }) => a + (l.duration || 0), 0),
                  0
                ) || 0;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                return `PT${hours}H${minutes}M`;
              })(),
            },
            numberOfCredits: course.modules?.reduce(
              (acc: number, m: { lessons: unknown[] }) => acc + m.lessons.length,
              0
            ) || 0,
          }}
        />
      )}
      <CourseDetailClient />
    </>
  );
}
