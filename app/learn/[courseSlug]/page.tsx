"use client";

import { lmsFetch } from "@/lib/api/lmsFetch";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Video,
  FileText,
  HelpCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LessonWithProgress {
  id: string;
  title: string;
  slug: string;
  type: "VIDEO" | "TEXT" | "QUIZ";
  duration?: number;
  order: number;
  completed: boolean;
}

interface ModuleWithLessons {
  id: string;
  title: string;
  order: number;
  lessons: LessonWithProgress[];
}

interface CourseContent {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl?: string;
    modules: ModuleWithLessons[];
  };
  enrollment: {
    id: string;
    status: string;
    enrolledAt: string;
  };
}

const lessonIcons = { VIDEO: Video, TEXT: FileText, QUIZ: HelpCircle };

export default function LearnCoursePage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();

  const { data, isLoading } = useQuery<CourseContent>({
    queryKey: ["learn-course", courseSlug],
    queryFn: async () => {
      const res = await lmsFetch(`/api/learn/courses/${courseSlug}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando curso");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Curso no encontrado</p>
      </div>
    );
  }

  const { course, enrollment } = data;
  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  );
  const completedLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
    0
  );
  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find first incomplete lesson for "Continue" button
  let nextLesson: { slug: string } | null = null;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (!lesson.completed) {
        nextLesson = lesson;
        break;
      }
    }
    if (nextLesson) break;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/learn">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Mis Cursos
        </Link>
      </Button>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {course.title}
            </h1>
            <Badge
              variant={
                enrollment.status === "COMPLETED" ? "default" : "secondary"
              }
            >
              {enrollment.status === "COMPLETED" ? "Completado" : "En progreso"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Progress value={progressPercent} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {completedLessons}/{totalLessons} lecciones ({progressPercent}%)
            </span>
          </div>
        </div>

        {nextLesson && (
          <Button asChild>
            <Link href={`/learn/${courseSlug}/${nextLesson.slug}`}>
              {completedLessons === 0 ? "Comenzar" : "Continuar"}
            </Link>
          </Button>
        )}

        <div className="space-y-3">
          {course.modules
            .sort((a, b) => a.order - b.order)
            .map((mod) => (
              <ModuleSection
                key={mod.id}
                module={mod}
                courseSlug={courseSlug}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function ModuleSection({
  module: mod,
  courseSlug,
}: {
  module: ModuleWithLessons;
  courseSlug: string;
}) {
  const [open, setOpen] = useState(true);
  const completedInModule = mod.lessons.filter((l) => l.completed).length;

  return (
    <Card>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div>
          <h3 className="font-medium">{mod.title}</h3>
          <p className="text-sm text-muted-foreground">
            {completedInModule}/{mod.lessons.length} completadas
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
                <Link
                  key={lesson.id}
                  href={`/learn/${courseSlug}/${lesson.slug}`}
                  className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 transition-colors"
                >
                  {lesson.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span
                    className={cn(
                      "text-sm flex-1",
                      lesson.completed && "text-muted-foreground"
                    )}
                  >
                    {lesson.title}
                  </span>
                  {lesson.duration && (
                    <span className="text-xs text-muted-foreground">
                      {Math.floor(lesson.duration / 60)}:
                      {(lesson.duration % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                </Link>
              );
            })}
        </CardContent>
      )}
    </Card>
  );
}
