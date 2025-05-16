"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Props = {
  user: {
    name?: string;
    email: string;
    avatar?: string;
    role: string;
  };
  session: {
    device: {
      browser: string;
      os: string;
      ipAddress: string;
      timezone: string;
    };
  };
};

export function DashboardCard({ user, session }: Props) {
  const avatarSrc = user.avatar || "/avatar.png";

  return (
    <Card className="w-full bg-[#18181b] shadow-inner rounded-xl p-4">
      <CardHeader className="p-0">
        <div className="flex items-center gap-4">
          <Image
            src={avatarSrc}
            alt="Avatar"
            width={56}
            height={56}
            className="rounded-full border border-black"
            unoptimized
          />
          <div className="flex-1 overflow-hidden">
            <CardTitle className="text-base text-white truncate">
              Bienvenido, {user.name || user.email}!
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="mt-4 space-y-2 text-sm text-white">
        <p>
          🎯 Rol: <strong className="text-red-400">{user.role}</strong>
        </p>
        <p>🖥️ Navegador: {session.device.browser}</p>
        <p>💻 Sistema operativo: {session.device.os}</p>
        <p>📍 IP: {session.device.ipAddress}</p>
        <p>⏰ Zona horaria: {session.device.timezone}</p>

        <div className="mt-4">
          <Button className="w-full sm:w-auto">Acción</Button>
        </div>
      </CardContent>
    </Card>
  );
}
