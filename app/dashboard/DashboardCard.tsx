"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import deviceMetaMap from "./deviceMetaMap.json";
import { toast } from "sonner";
import { buildClientMeta } from "@/lib/clientMeta";

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
    { label: string; icon: string; colorClass: string }
  >;
  return map[key] || map["default"];
}

export function DashboardCard({ user, session }: Props) {
  const avatarSrc = user.avatar || "/avatar.png";
  const browser = getMeta("browser", session.device.browser);
  const os = getMeta("os", session.device.os);
  const device = getMeta("device", session.device.device || "desktop");
  const isAdmin = user.role === "admin";

  const [screenResolution, setScreenResolution] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  const handleOpen = async (
    path: "/api/admin/n8n" | "/api/admin/odoo" | "/api/admin/baserow"
  ) => {
    try {
      setLoading(true);

      const meta = {
        ...buildClientMeta(),
        screenResolution,
      };

      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result?.message || "Error al iniciar sesión.");
        return;
      }

      toast.success("Redirigiendo a servicio...", {
        icon: "🚀",
        duration: 1000, // dura 1.5 segundos
      });
      //window.open(result.url, "_blank");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
      console.error("[Admin Panel Error]", err);
    } finally {
      setLoading(false);
    }
  };

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
          <i className={`text-lg ${os.icon} ${os.colorClass}`} />
          {os.label}
        </p>
        <p className="flex items-center gap-2">
          <i className={`text-lg ${browser.icon} ${browser.colorClass}`} />
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

        {isAdmin && (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => handleOpen("/api/admin/n8n")}
              className="flex-1"
            >
              Abrir N8N
            </Button>
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => handleOpen("/api/admin/odoo")}
              className="flex-1"
            >
              Abrir Odoo
            </Button>
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => handleOpen("/api/admin/baserow")}
              className="flex-1"
            >
              Abrir Baserow
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
