"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardClient() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [screenResolution, setScreenResolution] = useState("");
  const router = useRouter();

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  useEffect(() => {
    if (!screenResolution) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/account/me`, {
          method: "POST",
          credentials: "include", // 🔥 Esto mantiene cookies
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenResolution }),
        });

        if (res.status === 401) {
          // Si es específicamente 401 (Unauthorized), redirigimos
          router.push("/login");
          return;
        }

        if (!res.ok) {
          // Para otros errores, mostramos mensaje
          console.error("Error inesperado:", res.statusText);
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Error al cargar usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [screenResolution, router]);

  if (loading) {
    return <div>Cargando dashboard...</div>;
  }

  if (!user) {
    return <div>No autorizado.</div>;
  }

  return (
    <div className="text-lg">
      Bienvenido, {user.email}!
      <Button onClick={() => console.log("Acción!")}>Hacer algo</Button>
    </div>
  );
}
