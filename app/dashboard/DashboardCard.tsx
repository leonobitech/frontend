"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    path:
      | "/api/admin/n8n"
      | "/api/admin/odoo"
      | "/api/admin/baserow"
      | "/api/admin/chatwoot"
      | "/api/admin/ws-ticket"
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
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result?.message || "Error al iniciar sesión.");
        return;
      }

      // 🔀 Para Leonobit: navegar dentro de la app
      if (path === "/api/admin/ws-ticket") {
        toast.success("Conectando a Leonobit…", { icon: "🚀", duration: 900 });
        router.push("/ws-test"); // 👈 va a la página del WS
        return;
      }

      /* toast.success("Redirigiendo a servicio...", {
        icon: "🚀",
        duration: 1000, // dura 1.5 segundos
      }); */

      // 🌐 Otros servicios: abrir nueva pestaña como antes
      toast.success(`${result.url}`, { icon: "🚀", duration: 900 });
      window.open(result.url, "_blank");
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
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
            <Button
              className="w-full"
              variant="secondary"
              disabled={loading}
              onClick={() => handleOpen("/api/admin/n8n")}
            >
              N8N
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              disabled={loading}
              onClick={() => handleOpen("/api/admin/odoo")}
            >
              Odoo
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              disabled={loading}
              onClick={() => handleOpen("/api/admin/baserow")}
            >
              Baserow
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              disabled={loading}
              onClick={() => handleOpen("/api/admin/chatwoot")}
            >
              Chatwoot
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              disabled={loading}
              onClick={() => handleOpen("/api/admin/leonobit")}
            >
              Leonobit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
