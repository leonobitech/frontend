"use client";

import { lmsFetch } from "@/lib/api/lmsFetch";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Plus, Pencil, Eye, Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  modules: { id: string; lessons: { id: string }[] }[];
  _count: { enrollments: number; graduates: number };
}

const statusConfig = {
  DRAFT: { label: "Borrador", variant: "secondary" as const },
  PUBLISHED: { label: "Publicado", variant: "default" as const },
  ARCHIVED: { label: "Archivado", variant: "outline" as const },
};

export default function LmsDashboard() {
  const {
    data: courses,
    isLoading,
    error,
  } = useQuery<Course[]>({
    queryKey: ["lms-courses"],
    queryFn: async () => {
      const res = await lmsFetch("/api/lms/courses", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando cursos");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error: {(error as Error).message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {courses?.length || 0} curso{courses?.length !== 1 ? "s" : ""}
        </p>
        <Button asChild>
          <Link href="/admin/lms/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Curso
          </Link>
        </Button>
      </div>

      {!courses?.length ? (
        <Card>
          <CardContent className="!pt-12 pb-12 text-center">
            <p className="text-muted-foreground mb-4">
              No hay cursos todavía. Crea tu primer curso.
            </p>
            <Button asChild>
              <Link href="/admin/lms/courses/new">
                <Plus className="h-4 w-4 mr-2" />
                Crear Curso
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce(
              (acc, m) => acc + m.lessons.length,
              0
            );
            const cfg = statusConfig[course.status];

            return (
              <Card key={course.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate">
                        {course.title}
                      </h3>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {course.modules.length} módulo
                      {course.modules.length !== 1 ? "s" : ""} &middot;{" "}
                      {totalLessons} lección
                      {totalLessons !== 1 ? "es" : ""} &middot;{" "}
                      {course._count.enrollments} inscrito
                      {course._count.enrollments !== 1 ? "s" : ""} &middot; $
                      {course.price} {course.currency}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {course.status === "PUBLISHED" && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/courses/${course.slug}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/lms/courses/${course.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
