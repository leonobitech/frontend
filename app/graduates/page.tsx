"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PublicGraduate {
  id: string;
  slug: string;
  projectTitle: string;
  projectDescription: string;
  projectDemoUrl?: string;
  projectScreenshots: string[];
  publishedAt: string;
  user: { name: string; avatar?: string };
  course: { title: string; slug: string };
}

export default function GraduatesPage() {
  const { data: graduates, isLoading } = useQuery<PublicGraduate[]>({
    queryKey: ["public-graduates"],
    queryFn: async () => {
      const res = await fetch("/api/graduates");
      if (!res.ok) throw new Error("Error cargando graduados");
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl min-h-screen">
      <div className="text-center mb-12">
        <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h1 className="text-4xl font-bold tracking-tight mb-4">Graduados</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Proyectos finales de nuestros estudiantes. Cada uno demuestra dominio
          real del ecosistema Anthropic.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : !graduates?.length ? (
        <Card>
          <CardContent className="!pt-12 pb-16 text-center">
            <p className="text-muted-foreground">
              Aún no hay graduados publicados. Sé el primero en completar un
              curso y mostrar tu proyecto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {graduates.map((grad) => (
            <Link key={grad.id} href={`/graduates/${grad.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                {grad.projectScreenshots?.[0] && (
                  <div className="aspect-video overflow-hidden rounded-t-xl">
                    <img
                      src={grad.projectScreenshots[0]}
                      alt={grad.projectTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardContent className="p-6 space-y-3">
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {grad.projectTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {grad.projectDescription}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {grad.user.avatar ? (
                        <img
                          src={grad.user.avatar}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {grad.user.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm">{grad.user.name}</span>
                    </div>
                    <Badge variant="secondary">{grad.course.title}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
