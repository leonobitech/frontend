"use client";

import { useSession } from "@/app/context/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, isAuthenticated } = useSession();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center min-h-screen">
        <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Inicia sesión</h2>
        <p className="text-muted-foreground mb-6">
          Necesitas iniciar sesión para acceder a tus cursos.
        </p>
        <Button asChild>
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
