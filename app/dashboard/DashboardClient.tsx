// File: app/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildClientMeta, RequestMeta } from "@/lib/clientMeta";

interface User {
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [screenResolution, setScreenResolution] = useState("");

  const router = useRouter();

  // Capturar resolución una vez montado
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  useEffect(() => {
    if (!screenResolution) return;

    const fetchUser = async () => {
      try {
        const partialMeta = buildClientMeta();
        const meta: RequestMeta = { ...partialMeta, screenResolution };

        const res = await fetch("/api/account/me", {
          method: "POST",
          credentials: "include", // 🔥 Importante
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meta }),
        });

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [screenResolution, router]);

  if (loading) {
    return <div className="text-center text-lg">Cargando dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="text-center text-lg text-red-600">No autorizado</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Bienvenido, {user.email}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Este es tu dashboard personalizado.</p>
          <Button className="mt-4">Acción</Button>
        </CardContent>
      </Card>
    </div>
  );
}
