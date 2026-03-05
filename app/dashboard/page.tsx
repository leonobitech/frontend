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
    color: "text-purple-500",
  },
  {
    name: "Odoo",
    description: "ERP & CRM",
    icon: Package,
    path: "/api/admin/odoo" as const,
    color: "text-green-500",
  },
  {
    name: "Baserow",
    description: "Database platform",
    icon: Database,
    path: "/api/admin/baserow" as const,
    color: "text-blue-500",
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
      <div className="text-center py-8 text-muted-foreground">
        Cargando dashboard...
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8 text-red-600">No autorizado</div>;
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

      toast.success("Abriendo herramienta", { icon: "🚀", duration: 900 });
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">
            Welcome, {user.name || user.email}!
          </h1>
          {isAdmin && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Admin
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-2">
          {isAdmin ? "Gestiona tus herramientas" : "Bienvenido a tu panel"}
        </p>
      </div>

      {/* Admin Tools Section */}
      {isAdmin && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Herramientas de Trabajo</h2>
            <p className="text-muted-foreground">
              Acceso directo a las plataformas administrativas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADMIN_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.path}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleOpenTool(tool.path)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Icon className={`h-8 w-8 ${tool.color}`} />
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      size="sm"
                      disabled={loadingTool !== null}
                    >
                      {loadingTool === tool.path && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {loadingTool === tool.path ? "Abriendo..." : "Abrir"}
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
