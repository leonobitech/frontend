"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface LessonData {
  lesson: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    videoUrl?: string;
    duration?: number;
    type: "VIDEO" | "TEXT" | "QUIZ";
    content?: string;
    completed: boolean;
    completedAt?: string;
    module: { title: string; order: number };
  };
  enrollmentId: string;
}

export default function LessonPage() {
  const { courseSlug, lessonSlug } = useParams<{
    courseSlug: string;
    lessonSlug: string;
  }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<LessonData>({
    queryKey: ["learn-lesson", courseSlug, lessonSlug],
    queryFn: async () => {
      const res = await fetch(
        `/api/learn/courses/${courseSlug}/lessons/${lessonSlug}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Error cargando lección");
      const json = await res.json();
      return json.data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const res = await fetch(`/api/learn/lessons/${lessonId}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error marcando lección");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Lección completada");
      queryClient.invalidateQueries({
        queryKey: ["learn-lesson", courseSlug, lessonSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["learn-course", courseSlug],
      });
      queryClient.invalidateQueries({ queryKey: ["learn-courses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="aspect-video w-full mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Lección no encontrada</p>
      </div>
    );
  }

  const { lesson } = data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/learn/${courseSlug}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {lesson.module.title}
        </Link>
      </Button>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
          {lesson.completed && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Completada
            </Badge>
          )}
        </div>

        {lesson.type === "VIDEO" && lesson.videoUrl && (
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <video
              src={lesson.videoUrl}
              controls
              className="w-full h-full"
              controlsList="nodownload"
            />
          </div>
        )}

        {lesson.type === "TEXT" && lesson.content && (
          <Card>
            <CardContent className="py-6">
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                {lesson.content}
              </div>
            </CardContent>
          </Card>
        )}

        {lesson.description && (
          <p className="text-muted-foreground">{lesson.description}</p>
        )}

        {!lesson.completed && (
          <Button
            size="lg"
            onClick={() => completeMutation.mutate(lesson.id)}
            disabled={completeMutation.isPending}
            className="w-full sm:w-auto"
          >
            {completeMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Marcar como completada
          </Button>
        )}
      </div>
    </div>
  );
}
