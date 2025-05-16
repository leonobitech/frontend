import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "./DashboardCard";

export default function DashboardPage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardCard />
        </CardContent>
      </Card>
      <section className="space-y-6">
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
