"use client";

import { lmsFetch } from "@/lib/api/lmsFetch";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Video,
  FileText,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface Lesson {
  id: string;
  title: string;
  slug: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  type: "VIDEO" | "TEXT" | "QUIZ";
  content?: string;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  price: number;
  currency: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  modules: Module[];
  _count: { enrollments: number; graduates: number };
}

const lessonTypeIcons = {
  VIDEO: Video,
  TEXT: FileText,
  QUIZ: HelpCircle,
};

// =============================================================================
// API helpers
// =============================================================================

async function apiFetch(url: string, options?: RequestInit) {
  const res = await lmsFetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

// =============================================================================
// Main Page
// =============================================================================

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ["lms-course", id],
    queryFn: async () => {
      const json = await apiFetch(`/api/lms/courses/${id}`);
      return json.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Course>) =>
      apiFetch(`/api/lms/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Curso actualizado");
      queryClient.invalidateQueries({ queryKey: ["lms-course", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/lms/courses/${id}/publish`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Curso publicado");
      queryClient.invalidateQueries({ queryKey: ["lms-course", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/lms/courses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Curso archivado");
      router.push("/admin/lms");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Curso no encontrado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/lms">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {course.status === "DRAFT" && (
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              size="sm"
            >
              {publishMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Publicar
            </Button>
          )}
          {course.status !== "ARCHIVED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
            >
              Archivar
            </Button>
          )}
        </div>
      </div>

      <CourseDetailsForm course={course} onSave={updateMutation.mutate} saving={updateMutation.isPending} />

      <ModulesSection courseId={id} modules={course.modules} />
    </div>
  );
}

// =============================================================================
// Course Details Form
// =============================================================================

function CourseDetailsForm({
  course,
  onSave,
  saving,
}: {
  course: Course;
  onSave: (data: Partial<Course>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    title: course.title,
    slug: course.slug,
    description: course.description,
    price: course.price,
    currency: course.currency,
    thumbnailUrl: course.thumbnailUrl || "",
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Detalles del Curso</CardTitle>
          <Badge
            variant={
              course.status === "PUBLISHED"
                ? "default"
                : course.status === "DRAFT"
                ? "secondary"
                : "outline"
            }
          >
            {course.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descripción</Label>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Precio</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Input
              value={form.currency}
              onChange={(e) =>
                setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))
              }
              maxLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Thumbnail URL</Label>
            <Input
              value={form.thumbnailUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, thumbnailUrl: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>
        </div>

        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Cambios
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Modules Section
// =============================================================================

function ModulesSection({
  courseId,
  modules,
}: {
  courseId: string;
  modules: Module[];
}) {
  const queryClient = useQueryClient();
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const createModule = useMutation({
    mutationFn: async (title: string) =>
      apiFetch(`/api/lms/courses/${courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, order: modules.length }),
      }),
    onSuccess: () => {
      toast.success("Módulo creado");
      setNewModuleTitle("");
      queryClient.invalidateQueries({ queryKey: ["lms-course", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Módulos ({modules.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {modules
          .sort((a, b) => a.order - b.order)
          .map((mod) => (
            <ModuleItem key={mod.id} module={mod} courseId={courseId} />
          ))}

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="Nombre del nuevo módulo..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && newModuleTitle.trim()) {
                createModule.mutate(newModuleTitle.trim());
              }
            }}
          />
          <Button
            onClick={() => newModuleTitle.trim() && createModule.mutate(newModuleTitle.trim())}
            disabled={createModule.isPending || !newModuleTitle.trim()}
            size="sm"
          >
            {createModule.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Module Item (expandable)
// =============================================================================

function ModuleItem({ module: mod, courseId }: { module: Module; courseId: string }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(mod.title);
  const [newLesson, setNewLesson] = useState<{ title: string; slug: string; type: "VIDEO" | "TEXT" | "QUIZ" }>({ title: "", slug: "", type: "VIDEO" });

  const updateModule = useMutation({
    mutationFn: async (data: { title: string }) =>
      apiFetch(`/api/lms/modules/${mod.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Módulo actualizado");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["lms-course", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteModule = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/lms/modules/${mod.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Módulo eliminado");
      queryClient.invalidateQueries({ queryKey: ["lms-course", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createLesson = useMutation({
    mutationFn: async (data: { title: string; slug: string; type: string }) =>
      apiFetch(`/api/lms/modules/${mod.id}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, order: mod.lessons.length }),
      }),
    onSuccess: () => {
      toast.success("Lección creada");
      setNewLesson({ title: "", slug: "", type: "VIDEO" });
      queryClient.invalidateQueries({ queryKey: ["lms-course", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return (
    <div className="border border-border rounded-lg">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}

        {editing ? (
          <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") updateModule.mutate({ title });
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <Button size="sm" variant="ghost" onClick={() => updateModule.mutate({ title })}>
              <Save className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span className="font-medium flex-1">{mod.title}</span>
        )}

        <Badge variant="outline" className="text-xs">
          {mod.lessons.length} lección{mod.lessons.length !== 1 ? "es" : ""}
        </Badge>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { setEditing(true); setTitle(mod.title); }}
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => {
              if (confirm("¿Eliminar este módulo y todas sus lecciones?")) {
                deleteModule.mutate();
              }
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-3 space-y-2">
          {mod.lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson) => (
              <LessonItem key={lesson.id} lesson={lesson} courseId={courseId} />
            ))}

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input
              value={newLesson.title}
              onChange={(e) => {
                const t = e.target.value;
                setNewLesson((p) => ({ ...p, title: t, slug: slugify(t) }));
              }}
              placeholder="Nueva lección..."
              className="h-8"
            />
            <select
              value={newLesson.type}
              onChange={(e) =>
                setNewLesson((p) => ({ ...p, type: e.target.value as "VIDEO" | "TEXT" | "QUIZ" }))
              }
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="VIDEO">Video</option>
              <option value="TEXT">Texto</option>
              <option value="QUIZ">Quiz</option>
            </select>
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                if (newLesson.title.trim()) {
                  createLesson.mutate({
                    title: newLesson.title.trim(),
                    slug: newLesson.slug || slugify(newLesson.title.trim()),
                    type: newLesson.type,
                  });
                }
              }}
              disabled={createLesson.isPending || !newLesson.title.trim()}
            >
              {createLesson.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Lesson Item
// =============================================================================

function LessonItem({ lesson, courseId }: { lesson: Lesson; courseId: string }) {
  const queryClient = useQueryClient();
  const Icon = lessonTypeIcons[lesson.type];

  const deleteLesson = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/lms/lessons/${lesson.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Lección eliminada");
      queryClient.invalidateQueries({ queryKey: ["lms-course", courseId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group">
      <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm flex-1">{lesson.title}</span>
      <span className="text-xs text-muted-foreground">{lesson.slug}</span>
      {lesson.duration && (
        <span className="text-xs text-muted-foreground">
          {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, "0")}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
        onClick={() => {
          if (confirm("¿Eliminar esta lección?")) deleteLesson.mutate();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
