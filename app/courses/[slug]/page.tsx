"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Clock,
  Users,
  Video,
  FileText,
  HelpCircle,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CourseDetail {
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
    order: number;
    lessons: {
      id: string;
      title: string;
      slug: string;
      type: "VIDEO" | "TEXT" | "QUIZ";
      duration?: number;
      description?: string;
      order: number;
    }[];
  }[];
  _count: { enrollments: number; graduates: number };
}

const lessonIcons = { VIDEO: Video, TEXT: FileText, QUIZ: HelpCircle };

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: course, isLoading } = useQuery<CourseDetail>({
    queryKey: ["public-course", slug],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/courses/${slug}`
      );
      if (!res.ok) throw new Error("Curso no encontrado");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-12 w-2/3 mb-4" />
        <Skeleton className="h-6 w-full mb-8" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold">Curso no encontrado</h2>
        <Button asChild className="mt-4">
          <Link href="/courses">Ver todos los cursos</Link>
        </Button>
      </div>
    );
  }

  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );
  const totalDuration = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.duration || 0), 0),
    0
  );
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/courses">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Todos los cursos
        </Link>
      </Button>

      {course.thumbnailUrl && (
        <div className="aspect-video overflow-hidden rounded-xl mb-8">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {course.title}
          </h1>
          <p className="text-lg text-muted-foreground">{course.description}</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {course.modules.length} módulo
            {course.modules.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            {totalLessons} lección{totalLessons !== 1 ? "es" : ""}
          </Badge>
          {totalDuration > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {hours > 0 ? `${hours}h ` : ""}
              {minutes}min
            </Badge>
          )}
          {course._count.enrollments > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {course._count.enrollments} estudiante
              {course._count.enrollments !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <p className="text-3xl font-bold">
                ${course.price}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {course.currency}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">Acceso completo al curso</p>
            </div>
            <Button size="lg" disabled>
              Próximamente
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Contenido del curso</h2>
          {course.modules
            .sort((a, b) => a.order - b.order)
            .map((mod) => (
              <ModuleAccordion key={mod.id} module={mod} />
            ))}
        </div>
      </div>
    </div>
  );
}

function ModuleAccordion({
  module: mod,
}: {
  module: CourseDetail["modules"][0];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div>
          <h3 className="font-medium">{mod.title}</h3>
          <p className="text-sm text-muted-foreground">
            {mod.lessons.length} lección{mod.lessons.length !== 1 ? "es" : ""}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </div>
      {open && (
        <CardContent className="pt-0 space-y-1">
          {mod.lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson) => {
              const Icon = lessonIcons[lesson.type];
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{lesson.title}</span>
                  {lesson.duration && (
                    <span className="text-xs text-muted-foreground">
                      {Math.floor(lesson.duration / 60)}:
                      {(lesson.duration % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
              );
            })}
        </CardContent>
      )}
    </Card>
  );
}
