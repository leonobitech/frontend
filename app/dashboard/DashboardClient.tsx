"use client";

import { useSession } from "@/app/context/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function DashboardPage() {
  const { user, session, loading } = useSession();
  const router = useRouter();

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-center text-lg">Cargando dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="text-center text-lg text-red-600">No autorizado</div>
    );
  }

  const avatarSrc = user.avatar || "/avatar.png";

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Image
              src={avatarSrc}
              alt="Avatar"
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <CardTitle>Bienvenido, {user.name || user.email}!</CardTitle>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <p className="text-lg mb-2">
            🎯 Rol: <strong>{user.role}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            🖥️ Navegador: {session?.device.browser}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            💻 Sistema operativo: {session?.device.os}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            📍 IP: {session?.device.ipAddress}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            ⏰ Zona horaria: {session?.device.timezone}
          </p>
          <Button className="mt-4">Acción</Button>
        </CardContent>
      </Card>
    </div>
  );
}
