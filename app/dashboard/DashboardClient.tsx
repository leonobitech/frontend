// File: app/dashboard/DashboardClient.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface User {
  email: string;
}

export default function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [screenResolution, setScreenResolution] = useState("");

  const router = useRouter();

  // 1️⃣ Captura screenResolution en el primer render
  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // 2️⃣ Llama al backend cuando tengamos la resolución lista
  useEffect(() => {
    if (!screenResolution) return;

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/account/me", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenResolution }),
        });

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Error al obtener el usuario:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [screenResolution, router]);

  // 3️⃣ Estado de carga
  if (loading) {
    return <div className="text-center">Cargando dashboard...</div>;
  }

  // 4️⃣ Si no hay usuario después del intento → no autorizado
  if (!user) {
    return <div className="text-center text-red-500">No autorizado</div>;
  }

  return (
    <div className="text-lg">
      Bienvenido, <strong>{user.email}</strong>!
      <Button onClick={() => console.log("Acción!")}>Hacer algo</Button>
    </div>
  );
}
