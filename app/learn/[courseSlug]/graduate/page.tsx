"use client";

import { lmsFetch } from "@/lib/api/lmsFetch";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Trophy, Send } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SubmitProjectPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const router = useRouter();

  const [form, setForm] = useState({
    projectTitle: "",
    projectDescription: "",
    projectDemoUrl: "",
    projectScreenshots: [""],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await lmsFetch(`/api/learn/courses/${courseSlug}/graduate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          projectScreenshots: form.projectScreenshots.filter(Boolean),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error enviando proyecto");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(
        "Proyecto enviado. Un administrador lo revisará pronto."
      );
      router.push(`/learn/${courseSlug}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addScreenshotField = () => {
    setForm((p) => ({
      ...p,
      projectScreenshots: [...p.projectScreenshots, ""],
    }));
  };

  const updateScreenshot = (index: number, value: string) => {
    setForm((p) => ({
      ...p,
      projectScreenshots: p.projectScreenshots.map((s, i) =>
        i === index ? value : s
      ),
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/learn/${courseSlug}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al curso
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Enviar Proyecto Final
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Describe tu proyecto final. Un administrador lo revisará y, una vez
            aprobado, aparecerá en el directorio público de graduados.
          </p>

          <div className="space-y-2">
            <Label htmlFor="title">Título del Proyecto</Label>
            <Input
              id="title"
              value={form.projectTitle}
              onChange={(e) =>
                setForm((p) => ({ ...p, projectTitle: e.target.value }))
              }
              placeholder="Ej: Chatbot de atención al cliente con Claude"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.projectDescription}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  projectDescription: e.target.value,
                }))
              }
              placeholder="Describe qué hace tu proyecto, qué tecnologías usaste, y qué problema resuelve..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo">URL del Demo (opcional)</Label>
            <Input
              id="demo"
              value={form.projectDemoUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, projectDemoUrl: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Screenshots (URLs)</Label>
            {form.projectScreenshots.map((url, i) => (
              <Input
                key={i}
                value={url}
                onChange={(e) => updateScreenshot(i, e.target.value)}
                placeholder={`Screenshot ${i + 1} URL`}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addScreenshotField}
            >
              + Agregar screenshot
            </Button>
          </div>

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={
              submitMutation.isPending ||
              !form.projectTitle ||
              !form.projectDescription
            }
            className="w-full"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar Proyecto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
