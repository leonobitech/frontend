"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: 0,
    currency: "USD",
    thumbnailUrl: "",
  });
  const [autoSlug, setAutoSlug] = useState(true);

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/lms/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error creando curso");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Curso creado exitosamente");
      router.push(`/admin/lms/courses/${data.data.id}/edit`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      ...(autoSlug ? { slug: slugify(value) } : {}),
    }));
  };

  const handleSlugChange = (value: string) => {
    setAutoSlug(false);
    setForm((prev) => ({ ...prev, slug: value }));
  };

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/admin/lms">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Curso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ej: Claude para Empresas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="claude-para-empresas"
            />
            <p className="text-xs text-muted-foreground">
              /courses/{form.slug || "..."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descripción del curso..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    currency: e.target.value.toUpperCase(),
                  }))
                }
                maxLength={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail URL (opcional)</Label>
            <Input
              id="thumbnail"
              value={form.thumbnailUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>

          <Button
            onClick={() => createMutation.mutate(form)}
            disabled={
              createMutation.isPending || !form.title || !form.slug || !form.description
            }
            className="w-full"
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Crear Curso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
