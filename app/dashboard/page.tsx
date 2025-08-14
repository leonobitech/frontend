"use client";

import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "./DashboardCard";
import LabGrid from "@/components/labs/LabGrid";
import { LABS } from "@/data/labs";

export default function DashboardPage() {
  const { user, session, loading } = useSessionGuard();

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando dashboard...
      </div>
    );
  }

  if (!user || !session) {
    return <div className="text-center py-8 text-red-600">No autorizado</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardCard user={user} session={session} />
        </CardContent>
      </Card>

      <section className="space-y-4 mt-6">
        <h1 className="text-2xl font-bold">Laboratorios</h1>
        <p className="text-muted-foreground">
          Accesos rápidos a cada demo. Los que están “Próximamente” aparecen
          deshabilitados.
        </p>

        <LabGrid items={LABS} />
      </section>
    </div>
  );
}
