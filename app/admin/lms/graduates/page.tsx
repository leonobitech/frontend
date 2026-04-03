"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";

interface GraduateAdmin {
  id: string;
  slug: string;
  projectTitle: string;
  projectDescription: string;
  projectDemoUrl?: string;
  projectScreenshots: string[];
  verified: boolean;
  publishedAt?: string;
  createdAt: string;
  user: { id: string; email: string; name?: string; avatar?: string };
  course: { id: string; title: string; slug: string };
}

export default function AdminGraduatesPage() {
  const queryClient = useQueryClient();

  const { data: graduates, isLoading } = useQuery<GraduateAdmin[]>({
    queryKey: ["admin-graduates"],
    queryFn: async () => {
      const res = await fetch("/api/lms/graduates", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando graduados");
      const json = await res.json();
      return json.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({
      id,
      verified,
    }: {
      id: string;
      verified: boolean;
    }) => {
      const res = await fetch(`/api/lms/graduates/${id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ verified }),
      });
      if (!res.ok) throw new Error("Error actualizando");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-graduates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {graduates?.length || 0} proyecto
        {graduates?.length !== 1 ? "s" : ""} enviados
      </p>

      {!graduates?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No hay proyectos de graduados todavía.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {graduates.map((grad) => (
            <Card key={grad.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{grad.projectTitle}</h3>
                      <Badge
                        variant={grad.verified ? "default" : "outline"}
                      >
                        {grad.verified ? "Verificado" : "Pendiente"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {grad.user.name || grad.user.email} &middot;{" "}
                      {grad.course.title}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {grad.projectDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {grad.projectDemoUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={grad.projectDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Demo
                      </a>
                    </Button>
                  )}
                  {!grad.verified ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        verifyMutation.mutate({
                          id: grad.id,
                          verified: true,
                        })
                      }
                      disabled={verifyMutation.isPending}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aprobar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        verifyMutation.mutate({
                          id: grad.id,
                          verified: false,
                        })
                      }
                      disabled={verifyMutation.isPending}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Revocar
                    </Button>
                  )}
                </div>

                {grad.projectScreenshots.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {grad.projectScreenshots.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Screenshot ${i + 1}`}
                        className="h-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
