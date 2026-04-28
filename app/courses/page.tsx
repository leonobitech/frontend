"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Cpu, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { COURSE_BASE_URL, COURSE_TOTAL_STEPS } from "@/lib/course/steps";
import {
  COURSE_BASE_URL as FINANCEBENCH_COURSE_BASE_URL,
  COURSE_TOTAL_STEPS as FINANCEBENCH_COURSE_TOTAL_STEPS,
} from "@/lib/course-financebench/steps";
import { cn } from "@/lib/utils";

// Timeout corto para no dejar el skeleton colgado si el backend está down.
// Si el fetch no responde en BACKEND_TIMEOUT_MS, abortamos y el query falla —
// la sección "De pago" se oculta entera (opción A: skeleton breve, sin empty state).
const BACKEND_TIMEOUT_MS = 2000;

interface PublicCourse {
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
    lessons: { id: string; title: string; type: string; duration?: number }[];
  }[];
  _count: { enrollments: number; graduates: number };
}

// ─── Cursos gratuitos estáticos (viven en filesystem, no en el LMS) ───
// Se renderizan siempre, independientemente de si el backend responde o no.
// Si en el futuro se migra algún curso gratis al LMS, removerlo de acá.
const FREE_COURSES = [
  {
    id: "free-rust-embedded",
    title: "Rust Embedded desde Cero",
    slug: "rust-embedded-desde-cero",
    description:
      "9 pasos para ir de no sé Rust ni embedded a tener un firmware IoT corriendo en un ESP32-C3. Cada paso transforma el código del anterior.",
    href: COURSE_BASE_URL,
    tags: ["ESP32-C3", "Rust + ESP-IDF", "Español"],
    steps: COURSE_TOTAL_STEPS,
  },
  {
    id: "free-financial-rag-eval",
    title: "Financial RAG Evaluation Suite — from Zero",
    slug: "financial-rag-eval-from-zero",
    description:
      "Evaluación rigurosa de RAG sobre dominio financiero (FinanceBench + FinMTEB). Stages que arman tabla maestra, fine-tuning y failure mode analysis hasta cerrar en un activo paper-quality.",
    href: FINANCEBENCH_COURSE_BASE_URL,
    tags: ["FinanceBench + FinMTEB", "PyTorch + HuggingFace", "Español"],
    steps: FINANCEBENCH_COURSE_TOTAL_STEPS,
  },
] as const;

export default function CoursesPage() {
  const { data: courses, isLoading } = useQuery<PublicCourse[]>({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        BACKEND_TIMEOUT_MS,
      );
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/courses`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Error cargando cursos");
        const json = await res.json();
        return json.data;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const hasPaidCourses = !!courses?.length;
  // Estado final del query — después del timeout de 2s ya sabemos si el
  // backend respondió (hay cursos) o no (error/empty). Solo en ese momento
  // decidimos mostrar el empty state — evita el flash del "no hay cursos"
  // mientras el fetch está en vuelo.
  const queryResolved = !isLoading;
  const showEmpty = queryResolved && !hasPaidCourses;

  return (
    <div className="container mx-auto min-h-screen max-w-5xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">Cursos</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Aprende a construir soluciones empresariales con el ecosistema
          Anthropic. Cursos prácticos, de nivel profesional.
        </p>
      </div>

      {/* Cursos gratuitos — siempre visibles */}
      <section className="mb-12">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Gratuitos
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {FREE_COURSES.map((course) => (
            <Link key={course.id} href={course.href} className="group relative">
              {/* Glow halo rust orange (paleta del hero del curso) */}
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-[#E8734E]/0 via-[#E8734E]/0 to-[#C55A36]/0 opacity-0 blur-md transition-opacity duration-500 group-hover:from-[#E8734E]/20 group-hover:to-[#C55A36]/10 group-hover:opacity-100"
              />
              <Card
                className={cn(
                  "relative h-full cursor-pointer overflow-hidden",
                  "border-[#C8C2B8]/15",
                  "bg-gradient-to-br from-[#E8734E]/[0.06] via-transparent to-transparent",
                  "dark:bg-[#201F1D] dark:from-[#E8734E]/[0.05] dark:via-transparent dark:to-transparent",
                  "transition-all duration-300",
                  "hover:-translate-y-0.5 hover:border-[#E8734E]/40",
                  "hover:shadow-[0_10px_40px_-12px_rgba(232,115,78,0.3)]",
                )}
              >
                {/* Accent stripe horizontal en top — rust orange */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#E8734E] via-[#E8734E] to-[#C55A36]"
                />

                <CardContent className="relative space-y-5 px-6 pt-8 pb-7 md:pt-8 md:pb-7">
                  {/* Header row: chip de curso + badge Gratis */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8734E]">
                      <Cpu className="size-3" aria-hidden strokeWidth={2.2} />
                      Embedded · Rust
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8734E]/30 bg-[#E8734E]/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#E8734E]">
                      <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-[#E8734E] shadow-[0_0_8px_rgba(232,115,78,0.6)]"
                      />
                      Gratis
                    </span>
                  </div>

                  {/* Title — usa font display Fraunces como el hero del curso */}
                  <h2 className="font-course-display text-2xl font-semibold leading-tight tracking-tight transition-colors group-hover:text-[#E8734E]">
                    {course.title}
                  </h2>

                  {/* Description */}
                  <p className="line-clamp-2 text-sm leading-relaxed text-[#8E887E]">
                    {course.description}
                  </p>

                  {/* Meta chips — estilo dotted separators */}
                  <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-[#8E887E]">
                    <li className="inline-flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-[#E8734E]/60" aria-hidden />
                      {course.steps} pasos
                    </li>
                    {course.tags.map((tag) => (
                      <li key={tag} className="inline-flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-[#6B665E]/60" aria-hidden />
                        {tag}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="flex items-center gap-2 pt-1 font-mono text-xs font-semibold uppercase tracking-wider text-[#E8734E]">
                    <span>Empezar curso</span>
                    <ArrowRight
                      className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden
                      strokeWidth={2.5}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Cursos de pago — skeleton máx 2s, después cards o empty state */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          De pago
        </h2>
        {showEmpty ? (
          <Card className="border-dashed">
            <CardContent className="px-6 pt-8 pb-8 text-center md:pt-8 md:pb-8">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Más cursos en preparación.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {isLoading
              ? [1, 2].map((i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl" />
                ))
              : courses!.map((course) => {
                  const totalLessons = course.modules.reduce(
                    (acc, m) => acc + m.lessons.length,
                    0,
                  );
                  const totalDuration = course.modules.reduce(
                    (acc, m) =>
                      acc +
                      m.lessons.reduce((a, l) => a + (l.duration || 0), 0),
                    0,
                  );
                  const hours = Math.floor(totalDuration / 3600);
                  const minutes = Math.floor((totalDuration % 3600) / 60);

                  return (
                    <Link key={course.id} href={`/courses/${course.slug}`}>
                      <Card className="group h-full cursor-pointer transition-shadow hover:shadow-lg">
                        {course.thumbnailUrl && (
                          <div className="aspect-video overflow-hidden rounded-t-xl">
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}
                        <CardContent className="space-y-3 px-6 pt-6 pb-6 md:pt-6 md:pb-6">
                          <h2 className="text-xl font-semibold transition-colors group-hover:text-primary">
                            {course.title}
                          </h2>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {course.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {course.modules.length} módulo
                              {course.modules.length !== 1 ? "s" : ""}
                            </Badge>
                            <Badge variant="secondary">
                              {totalLessons} lección
                              {totalLessons !== 1 ? "es" : ""}
                            </Badge>
                            {totalDuration > 0 && (
                              <Badge variant="secondary">
                                {hours > 0 ? `${hours}h ` : ""}
                                {minutes}min
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-2xl font-bold">
                              ${course.price}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                {course.currency}
                              </span>
                            </span>
                            {course._count.enrollments > 0 && (
                              <span className="text-sm text-muted-foreground">
                                {course._count.enrollments} estudiante
                                {course._count.enrollments !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
          </div>
        )}
      </section>
    </div>
  );
}
