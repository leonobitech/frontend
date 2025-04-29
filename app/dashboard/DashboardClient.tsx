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
    if (!screenResolution) return; // esperamos a tener screenResolution

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/account/me`, {
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
        console.error(error);
        router.push("/login");
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
    return <div>No autorizado</div>;
  }

  return (
    <div className="text-lg">
      Bienvenido, {user.email}!
      <Button onClick={() => console.log("Acción!")}>Hacer algo</Button>
    </div>
  );
}
