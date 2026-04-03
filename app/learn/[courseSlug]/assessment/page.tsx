"use client";

import { lmsFetch } from "@/lib/api/lmsFetch";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  type: "multiple_choice" | "true_false";
  options: string[];
}

interface AssessmentData {
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    questionCount: number;
    questions: Question[];
  };
  attempts: {
    id: string;
    score: number;
    passed: boolean;
    completedAt: string;
  }[];
  enrollmentId: string;
}

interface SubmitResult {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  passingScore: number;
}

export default function AssessmentPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  const { data, isLoading, error } = useQuery<AssessmentData>({
    queryKey: ["learn-assessment", courseSlug],
    queryFn: async () => {
      const res = await lmsFetch(`/api/learn/courses/${courseSlug}/assessment`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error cargando evaluación");
      }
      const json = await res.json();
      return json.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/learn/assessments/${data!.assessment.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ answers }),
        }
      );
      if (!res.ok) throw new Error("Error enviando evaluación");
      const json = await res.json();
      return json.data as SubmitResult;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.passed) {
        toast.success("Aprobaste la evaluación");
      } else {
        toast.error("No alcanzaste el puntaje mínimo");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/learn/${courseSlug}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al curso
          </Link>
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {(error as Error).message}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { assessment, attempts } = data;
  const allAnswered =
    Object.keys(answers).length === assessment.questions.length;

  // Show result screen
  if (result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            {result.passed ? (
              <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
            ) : (
              <XCircle className="h-16 w-16 mx-auto text-destructive" />
            )}
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {result.passed ? "Aprobado" : "No aprobado"}
              </h2>
              <p className="text-4xl font-bold mb-1">{result.score}%</p>
              <p className="text-muted-foreground">
                {result.correct}/{result.total} respuestas correctas
                (mínimo: {result.passingScore}%)
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {result.passed ? (
                <Button asChild size="lg">
                  <Link href={`/learn/${courseSlug}`}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Volver al curso
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Intentar de nuevo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/learn/${courseSlug}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al curso
        </Link>
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {assessment.title}
          </h1>
          <p className="text-muted-foreground">
            {assessment.questionCount} preguntas &middot; Puntaje mínimo:{" "}
            {assessment.passingScore}%
          </p>
          {attempts.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Intentos previos: {attempts.length} &middot; Mejor puntaje:{" "}
              {Math.max(...attempts.map((a) => a.score))}%
            </p>
          )}
        </div>

        <Progress
          value={
            (Object.keys(answers).length / assessment.questions.length) * 100
          }
          className="h-2"
        />

        {assessment.questions.map((q, qIndex) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {qIndex + 1}. {q.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.options.map((option, optIndex) => (
                <button
                  key={optIndex}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: optIndex }))
                  }
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border transition-colors",
                    answers[q.id] === optIndex
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  {option}
                </button>
              ))}
            </CardContent>
          </Card>
        ))}

        <Button
          size="lg"
          onClick={() => submitMutation.mutate()}
          disabled={!allAnswered || submitMutation.isPending}
          className="w-full"
        >
          {submitMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Enviar Evaluación ({Object.keys(answers).length}/
          {assessment.questions.length})
        </Button>
      </div>
    </div>
  );
}
