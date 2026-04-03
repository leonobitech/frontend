"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import Link from "next/link";

interface PublicCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  price: number;
  currency: string;
  modules: {
    id: string;
    title: string;
    lessons: { id: string; title: string; type: string; duration?: number }[];
  }[];
  _count: { enrollments: number; graduates: number };
}

export default function CoursesPage() {
  const { data: courses, isLoading } = useQuery<PublicCourse[]>({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/courses`
      );
      if (!res.ok) throw new Error("Error cargando cursos");
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Cursos</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Aprende a construir soluciones empresariales con el ecosistema
          Anthropic. Cursos prácticos, de nivel profesional.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : !courses?.length ? (
        <Card>
          <CardContent className="!pt-12 pb-16 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Próximamente</h2>
            <p className="text-muted-foreground">
              Los cursos están en preparación. Vuelve pronto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce(
              (acc, m) => acc + m.lessons.length,
              0
            );
            const totalDuration = course.modules.reduce(
              (acc, m) =>
                acc +
                m.lessons.reduce((a, l) => a + (l.duration || 0), 0),
              0
            );
            const hours = Math.floor(totalDuration / 3600);
            const minutes = Math.floor((totalDuration % 3600) / 60);

            return (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  {course.thumbnailUrl && (
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6 space-y-3">
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {course.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {course.modules.length} módulo
                        {course.modules.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="secondary">
                        {totalLessons} lección
                        {totalLessons !== 1 ? "es" : ""}
                      </Badge>
                      {totalDuration > 0 && (
                        <Badge variant="secondary">
                          {hours > 0 ? `${hours}h ` : ""}
                          {minutes}min
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-2xl font-bold">
                        ${course.price}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          {course.currency}
                        </span>
                      </span>
                      {course._count.enrollments > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {course._count.enrollments} estudiante
                          {course._count.enrollments !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
