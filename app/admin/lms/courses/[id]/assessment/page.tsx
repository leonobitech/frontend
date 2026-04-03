"use client";

import { lmsFetch } from "@/lib/api/lmsFetch";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  type: "multiple_choice" | "true_false";
  options: string[];
  correctAnswer: number;
}

interface Assessment {
  id: string;
  title: string;
  questions: Question[];
  passingScore: number;
  courseId: string;
}

interface Course {
  id: string;
  title: string;
  assessments: Assessment[];
}

export default function AssessmentEditorPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ["lms-course", courseId],
    queryFn: async () => {
      const res = await lmsFetch(`/api/lms/courses/${courseId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando curso");
      const json = await res.json();
      return json.data;
    },
  });

  // Check if assessment already exists
  const existingAssessment = course?.assessments?.[0] as Assessment | undefined;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/admin/lms/courses/${courseId}/edit`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al curso
        </Link>
      </Button>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <HelpCircle className="h-6 w-6" />
        Evaluación — {course?.title}
      </h2>

      <AssessmentForm
        courseId={courseId}
        existing={existingAssessment}
      />
    </div>
  );
}

function AssessmentForm({
  courseId,
  existing,
}: {
  courseId: string;
  existing?: Assessment;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(existing?.title || "Evaluación Final");
  const [passingScore, setPassingScore] = useState(existing?.passingScore || 70);
  const [questions, setQuestions] = useState<Question[]>(
    existing?.questions || []
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (existing) {
        const res = await lmsFetch(`/api/lms/assessments/${existing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, questions, passingScore }),
        });
        if (!res.ok) throw new Error("Error actualizando");
        return res.json();
      } else {
        const res = await lmsFetch(`/api/lms/courses/${courseId}/assessments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, questions, passingScore }),
        });
        if (!res.ok) throw new Error("Error creando");
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success(existing ? "Evaluación actualizada" : "Evaluación creada");
      queryClient.invalidateQueries({ queryKey: ["lms-course", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addQuestion = (type: "multiple_choice" | "true_false") => {
    const newQ: Question = {
      id: crypto.randomUUID(),
      text: "",
      type,
      options:
        type === "true_false"
          ? ["Verdadero", "Falso"]
          : ["", "", "", ""],
      correctAnswer: 0,
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === optIndex ? value : o)) }
          : q
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Puntaje mínimo (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {questions.map((q, qIndex) => (
        <Card key={q.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Pregunta {qIndex + 1}
                <Badge variant="outline" className="ml-2 text-xs">
                  {q.type === "true_false" ? "V/F" : "Opción múltiple"}
                </Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => removeQuestion(qIndex)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={q.text}
              onChange={(e) =>
                updateQuestion(qIndex, { text: e.target.value })
              }
              placeholder="Escribe la pregunta..."
            />
            <div className="space-y-2">
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestion(qIndex, { correctAnswer: optIndex })
                    }
                    className="shrink-0"
                  >
                    {q.correctAnswer === optIndex ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </button>
                  {q.type === "true_false" ? (
                    <span className="text-sm">{opt}</span>
                  ) : (
                    <Input
                      value={opt}
                      onChange={(e) =>
                        updateOption(qIndex, optIndex, e.target.value)
                      }
                      placeholder={`Opción ${optIndex + 1}`}
                      className="h-8"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => addQuestion("multiple_choice")}
        >
          <Plus className="h-4 w-4 mr-1" />
          Opción múltiple
        </Button>
        <Button
          variant="outline"
          onClick={() => addQuestion("true_false")}
        >
          <Plus className="h-4 w-4 mr-1" />
          Verdadero/Falso
        </Button>
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || questions.length === 0}
        className="w-full"
      >
        {saveMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {existing ? "Actualizar Evaluación" : "Crear Evaluación"}
      </Button>
    </div>
  );
}
