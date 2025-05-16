"use client";

import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "./DashboardCard";

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
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardCard user={user} session={session} />
        </CardContent>
      </Card>

      <section className="space-y-6 mt-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>
          Bienvenido a tu panel. Acá podrías ver estadísticas, accesos rápidos,
          etc.
        </p>

        <div className="grid gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
              📦 Item #{i + 1}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
