"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, Trophy, Github, Twitter } from "lucide-react";
import Link from "next/link";

interface GraduateProfile {
  id: string;
  slug: string;
  projectTitle: string;
  projectDescription: string;
  projectDemoUrl?: string;
  projectScreenshots: string[];
  publishedAt: string;
  user: {
    name: string;
    avatar?: string;
    bio?: string;
    website?: string;
    socialTwitter?: string;
    socialGithub?: string;
  };
  course: { title: string; slug: string; description: string };
}

export default function GraduateProfilePage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: graduate, isLoading } = useQuery<GraduateProfile>({
    queryKey: ["public-graduate", slug],
    queryFn: async () => {
      const res = await fetch(`/api/graduates/${slug}`);
      if (!res.ok) throw new Error("Graduado no encontrado");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl min-h-screen">
        <Skeleton className="h-12 w-2/3 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!graduate) {
    return (
      <div className="container mx-auto px-4 py-12 text-center min-h-screen">
        <h2 className="text-2xl font-semibold">Graduado no encontrado</h2>
        <Button asChild className="mt-4">
          <Link href="/graduates">Ver todos los graduados</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl min-h-screen">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/graduates">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Todos los graduados
        </Link>
      </Button>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          {graduate.user.avatar ? (
            <img
              src={graduate.user.avatar}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-bold">
              {graduate.user.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{graduate.user.name}</h1>
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            {graduate.user.bio && (
              <p className="text-muted-foreground">{graduate.user.bio}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary">{graduate.course.title}</Badge>
              {graduate.user.socialGithub && (
                <a
                  href={graduate.user.socialGithub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {graduate.user.socialTwitter && (
                <a
                  href={graduate.user.socialTwitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Project */}
        <Card>
          <CardContent className="py-6 space-y-4">
            <h2 className="text-xl font-semibold">{graduate.projectTitle}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {graduate.projectDescription}
            </p>
            {graduate.projectDemoUrl && (
              <Button asChild variant="outline">
                <a
                  href={graduate.projectDemoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Demo
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Screenshots */}
        {graduate.projectScreenshots.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Screenshots</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {graduate.projectScreenshots.map((url, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-xl overflow-hidden bg-muted"
                >
                  <img
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
