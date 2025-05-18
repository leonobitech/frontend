"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import deviceMetaMap from "./deviceMetaMap.json";

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
      device: string;
    };
  };
};

function getMeta(category: "browser" | "os" | "device", raw: string) {
  const key = raw.toLowerCase().split(" ")[0];

  const map = deviceMetaMap[category] as Record<
    string,
    { label: string; icon: string; colorClass: string } // ← ✅ cambiamos 'color' por 'colorClass'
  >;

  return map[key] || map["default"];
}

export function DashboardCard({ user, session }: Props) {
  const avatarSrc = user.avatar || "/avatar.png";
  const browser = getMeta("browser", session.device.browser);
  const os = getMeta("os", session.device.os);
  const device = getMeta("device", session.device.device || "desktop");

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

        <p className="flex items-center gap-2">
          <i className={`text-lg ${device.icon} ${device.colorClass}`} />
          {device.label}
        </p>
        <p className="flex items-center gap-2">
          <i className={`text-lg ${device.icon} ${device.colorClass}`} />
          {os.label}
        </p>
        <p className="flex items-center gap-2">
          <i className={`text-lg ${device.icon} ${device.colorClass}`} />
          {browser.label}
        </p>
        <p className="flex items-center gap-2">
          <i className="ri-map-pin-line text-lg" />
          {session.device.ipAddress}
        </p>
        <p className="flex items-center gap-2">
          <i className="ri-time-line text-lg" />
          {session.device.timezone.split("/").pop()?.replace("_", " ")}
        </p>

        <div className="mt-4">
          <Button className="w-full sm:w-auto">Acción</Button>
        </div>
      </CardContent>
    </Card>
  );
}
