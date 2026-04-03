"use client";

import { lmsFetch } from "@/lib/api/lmsFetch";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

interface Enrollment {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "REFUNDED";
  enrolledAt: string;
  completedAt: string | null;
  user: { id: string; email: string; name: string | null; avatar: string | null };
  course: { id: string; title: string; slug: string };
  _count: { progress: number };
}

const statusConfig = {
  ACTIVE: { label: "Activo", variant: "default" as const },
  COMPLETED: { label: "Completado", variant: "secondary" as const },
  EXPIRED: { label: "Expirado", variant: "outline" as const },
  REFUNDED: { label: "Reembolsado", variant: "destructive" as const },
};

export default function StudentsPage() {
  const { data: enrollments, isLoading } = useQuery<Enrollment[]>({
    queryKey: ["lms-enrollments"],
    queryFn: async () => {
      const res = await lmsFetch("/api/lms/enrollments", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando inscripciones");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {enrollments?.length || 0} inscripción
        {enrollments?.length !== 1 ? "es" : ""} en total
      </p>

      {!enrollments?.length ? (
        <Card>
          <CardContent className="!pt-12 pb-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay estudiantes inscritos todavía.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const cfg = statusConfig[enrollment.status];
            return (
              <Card key={enrollment.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {enrollment.user.avatar ? (
                      <img
                        src={enrollment.user.avatar}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {(enrollment.user.name || enrollment.user.email)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {enrollment.user.name || enrollment.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {enrollment.user.email} &middot; {enrollment.course.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right text-sm text-muted-foreground hidden md:block">
                      <p>
                        Inscrito:{" "}
                        {new Date(enrollment.enrolledAt).toLocaleDateString("es")}
                      </p>
                      <p>{enrollment._count.progress} lecciones completadas</p>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
