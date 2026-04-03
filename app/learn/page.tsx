"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

interface EnrolledCourse {
  id: string;
  status: string;
  enrolledAt: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string;
  };
}

export default function LearnDashboard() {
  const { data: courses, isLoading } = useQuery<EnrolledCourse[]>({
    queryKey: ["learn-courses"],
    queryFn: async () => {
      const res = await fetch("/api/learn/courses", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando cursos");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-10 w-48 mb-6" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full mb-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <GraduationCap className="h-8 w-8" />
        <h1 className="text-3xl font-bold tracking-tight">Mis Cursos</h1>
      </div>

      {!courses?.length ? (
        <Card>
          <CardContent className="pt-12 pb-16 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              No tienes cursos todavía
            </h2>
            <p className="text-muted-foreground mb-6">
              Explora nuestro catálogo y empieza a aprender.
            </p>
            <Button asChild>
              <Link href="/courses">Ver Cursos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((enrollment) => (
            <Link
              key={enrollment.id}
              href={`/learn/${enrollment.course.slug}`}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="flex items-center gap-6 py-5">
                  {enrollment.course.thumbnailUrl && (
                    <div className="hidden sm:block w-32 h-20 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={enrollment.course.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {enrollment.course.title}
                      </h3>
                      <Badge
                        variant={
                          enrollment.status === "COMPLETED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {enrollment.status === "COMPLETED"
                          ? "Completado"
                          : "En progreso"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={enrollment.progressPercent}
                        className="flex-1 h-2"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {enrollment.completedLessons}/{enrollment.totalLessons}{" "}
                        lecciones
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
