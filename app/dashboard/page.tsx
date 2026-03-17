"use client";

import { useState, useEffect } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Workflow, Package, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

const ADMIN_TOOLS = [
  {
    name: "N8N",
    description: "Workflow automation",
    icon: Workflow,
    path: "/api/admin/n8n" as const,
  },
  {
    name: "Odoo",
    description: "ERP & CRM",
    icon: Package,
    path: "/api/admin/odoo" as const,
  },
  {
    name: "Baserow",
    description: "Database platform",
    icon: Database,
    path: "/api/admin/baserow" as const,
  },
];

export default function DashboardPage() {
  const { user, loading } = useSessionGuard();
  const [screenResolution, setScreenResolution] = useState("");
  const [loadingTool, setLoadingTool] = useState<string | null>(null);

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Cargando dashboard...
      </div>
    );
  }

  if (!user) {
    return <div className="flex min-h-[60vh] items-center justify-center text-red-600">No autorizado</div>;
  }

  const isAdmin = user.role === "admin";

  const handleOpenTool = async (toolPath: typeof ADMIN_TOOLS[number]["path"]) => {
    try {
      if (loadingTool) return;
      setLoadingTool(toolPath);

      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `${toolPath}:${requestId}`;

      const win = window.open("", "_blank");

      const res = await fetch(toolPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({ meta }),
        credentials: "include",
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result?.message || "Error al iniciar sesión.");
        if (win && !win.closed) win.close();
        return;
      }

      toast.success("Abriendo herramienta", { duration: 900 });
      if (win && !win.closed) {
        win.location.href = result.url;
      } else {
        window.open(result.url, "_blank");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
    } finally {
      setLoadingTool(null);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#3A3A3A] dark:text-[#D1D5DB]">
            Bienvenido, {user.name || user.email}
          </h1>
          {isAdmin && (
            <Badge className="bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isAdmin ? "Gestiona tus herramientas" : "Tu panel de control"}
        </p>
      </div>

      {/* Admin Tools */}
      {isAdmin && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#3A3A3A] dark:text-[#D1D5DB]">
            Herramientas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ADMIN_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isLoading = loadingTool === tool.path;
              return (
                <Card
                  key={tool.path}
                  className="cursor-pointer transition-all hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-white/5"
                  onClick={() => handleOpenTool(tool.path)}
                >
                  <CardHeader className="pb-2">
                    <Icon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    <CardTitle className="text-base text-[#3A3A3A] dark:text-[#D1D5DB]">
                      {tool.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full bg-[#3A3A3A] dark:bg-[#D1D5DB] text-white dark:text-[#3A3A3A] shadow-md transition-all hover:shadow-lg hover:shadow-black/20 dark:hover:shadow-white/15"
                      size="sm"
                      disabled={loadingTool !== null}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isLoading ? "Abriendo..." : "Abrir"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
