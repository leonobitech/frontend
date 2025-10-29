"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlugZap, Loader2 } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { toast } from "sonner";
import { SkeuoToggleButton } from "@/components/ui/skeuo/button/SkeuoToggleButton";

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

    // 🔄 Polling: Check status every 30 seconds (only when tab is visible)
    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollInterval) return; // Already polling
      pollInterval = setInterval(() => {
        checkStatus();
      }, 30000); // 30 segundos
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // 👁️ Visibility change: Start/stop polling based on tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        checkStatus(); // Immediate check when tab becomes visible
        startPolling();
      }
    };

    // Start initial polling
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
      if (connecting) return;
      setConnecting(true);

      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/service/odoo-mcp:${requestId}`;

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

      toast.success(`Abriendo Odoo MCP...`, { icon: "🔌", duration: 900 });
      if (win && !win.closed) {
        win.location.href = result.url;
      } else {
        window.open(result.url, "_blank");
      }

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
    try {
      await fetch("https://odoo-mcp.leonobitech.com/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      toast.success("Odoo MCP disconnected", { icon: "🔌" });
      checkStatus();
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect");
    }
  };

  const handleToggle = () => {
    if (hasSession) {
      handleDisconnect();
    } else {
      handleConnect();
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

  // 🎨 Collapsed sidebar: Solo ícono con efecto LED
  if (isCollapsed) {
    return (
      <div className="px-2 py-2 flex justify-center">
        <motion.button
          onClick={handleConnect}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative p-2 rounded-lg transition-all duration-300",
            "hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
          title={
            hasActiveConnector
              ? "Odoo MCP Active"
              : hasSession
              ? "Odoo MCP Connected"
              : "Connect Odoo MCP"
          }
        >
          <PlugZap
            className={cn(
              "h-5 w-5 transition-all duration-300",
              hasActiveConnector && [
                "text-green-500 dark:text-green-400",
                "drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]",
                "animate-pulse",
              ],
              hasSession && !hasActiveConnector && [
                "text-blue-500 dark:text-blue-400",
                "drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]",
              ],
              !hasSession && "text-gray-400 dark:text-gray-600"
            )}
          />
          {/* LED badge indicator */}
          {hasSession && (
            <motion.div
              className={cn(
                "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
                hasActiveConnector
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                  : "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
              )}
              animate={hasActiveConnector ? { opacity: [1, 0.5, 1] } : {}}
              transition={hasActiveConnector ? { repeat: Infinity, duration: 2 } : {}}
            />
          )}
        </motion.button>
      </div>
    );
  }

  // 🎨 Expanded sidebar: SkeuoToggleButton con labels
  return (
    <div className="px-2 py-2">
      <div className="flex items-center gap-3">
        <div className="relative">
          <PlugZap
            className={cn(
              "h-5 w-5 transition-all duration-300",
              hasActiveConnector && [
                "text-green-500 dark:text-green-400",
                "drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]",
              ],
              hasSession && !hasActiveConnector && [
                "text-blue-500 dark:text-blue-400",
                "drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]",
              ],
              !hasSession && "text-gray-400 dark:text-gray-600"
            )}
          />
          {hasSession && (
            <motion.div
              className={cn(
                "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                hasActiveConnector
                  ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                  : "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
              )}
              animate={hasActiveConnector ? { opacity: [1, 0.5, 1] } : {}}
              transition={hasActiveConnector ? { repeat: Infinity, duration: 2 } : {}}
            />
          )}
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Odoo MCP
            </span>
            <SkeuoToggleButton
              isOpen={hasSession}
              onToggle={handleToggle}
              size="sm"
              iconOpen={<PlugZap className="h-3 w-3" />}
              iconClosed={<PlugZap className="h-3 w-3" />}
              title={hasSession ? "Disconnect" : "Connect"}
            />
          </div>

          {/* Status label */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                hasActiveConnector && "text-green-600 dark:text-green-400",
                hasSession && !hasActiveConnector && "text-blue-600 dark:text-blue-400",
                !hasSession && "text-gray-500 dark:text-gray-500"
              )}
            >
              {hasActiveConnector ? "Active" : hasSession ? "Connected" : "Disconnected"}
            </span>
            {status?.email && hasSession && (
              <>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {status.email}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
