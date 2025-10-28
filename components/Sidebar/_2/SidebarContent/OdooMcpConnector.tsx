"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plug, PlugZap, Loader2, ExternalLink, LogOut } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { toast } from "sonner";

interface ConnectorStatus {
  authenticated: boolean;
  hasSession: boolean;
  email?: string | null;
  connectorActive?: boolean;
  sessionCreatedAt?: string;
}

export const OdooMcpConnector = () => {
  const [status, setStatus] = useState<ConnectorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [screenResolution, setScreenResolution] = useState("");
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch("https://odoo-mcp.leonobitech.com/auth/status", {
        credentials: "include",
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error checking Odoo MCP status:", error);
      setStatus({ authenticated: false, hasSession: false });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      // Evita doble click
      if (connecting) return;
      setConnecting(true);

      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      // IDs de trazabilidad
      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/service/odoo-mcp:${requestId}`;

      // Abre la pestaña ANTES del fetch para evitar pop-up blocked
      const win = window.open("", "_blank");

      const res = await fetch("/api/service/odoo-mcp", {
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
        toast.error(result?.message || "Error al abrir Odoo MCP.");
        if (win && !win.closed) win.close();
        return;
      }

      // Feedback y redirección segura a la pestaña ya abierta
      toast.success(`Abriendo Odoo MCP...`, { icon: "🔌", duration: 900 });
      if (win && !win.closed) {
        win.location.href = result.url;
      } else {
        window.open(result.url, "_blank");
      }

      // Refresh status after window opens
      setTimeout(() => checkStatus(), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
      console.error("[Odoo MCP Connector Error]", err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect the Odoo MCP connector?")) {
      return;
    }

    try {
      await fetch("https://odoo-mcp.leonobitech.com/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      checkStatus();
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  if (loading) {
    return (
      <div className="px-2 py-2">
        <div className={cn(
          "flex items-center justify-center gap-2 p-2 rounded-md",
          "bg-gray-100 dark:bg-gray-800"
        )}>
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          {!isCollapsed && <span className="text-xs text-gray-500">Loading...</span>}
        </div>
      </div>
    );
  }

  const hasActiveConnector = status?.hasSession && status?.connectorActive;
  const hasSession = status?.hasSession;

  return (
    <div className="px-2 py-2">
      <motion.button
        onClick={handleConnect}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full flex items-center gap-2 p-2 rounded-md transition-all",
          "group relative overflow-hidden",
          hasActiveConnector
            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
            : hasSession
            ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
            : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        )}
      >
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {hasActiveConnector ? (
            <PlugZap className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Plug className="h-4 w-4 flex-shrink-0" />
          )}

          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-semibold truncate">
                {hasActiveConnector ? "Odoo MCP Active" : hasSession ? "Odoo MCP Ready" : "Connect Odoo MCP"}
              </div>
              {status?.email && (
                <div className={cn(
                  "text-xs truncate",
                  hasActiveConnector || hasSession ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                )}>
                  {status.email}
                </div>
              )}
            </div>
          )}

          {!isCollapsed && (
            <ExternalLink className={cn(
              "h-3 w-3 flex-shrink-0 opacity-60 group-hover:opacity-100",
              hasActiveConnector || hasSession ? "text-white" : "text-gray-500"
            )} />
          )}
        </div>

        {/* Pulsing indicator for active connector */}
        {hasActiveConnector && (
          <motion.div
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-white"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>

      {/* Disconnect button when session is active */}
      {hasSession && !isCollapsed && (
        <motion.button
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onClick={handleDisconnect}
          className={cn(
            "w-full mt-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md",
            "text-xs text-red-600 dark:text-red-400",
            "hover:bg-red-50 dark:hover:bg-red-950/20",
            "transition-colors"
          )}
        >
          <LogOut className="h-3 w-3" />
          <span>Disconnect</span>
        </motion.button>
      )}
    </div>
  );
};
