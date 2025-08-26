"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Mic, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScreenResolution } from "@/hooks/useScreenResolution";

export default function LeonobitPage() {
  const { user, session, loading } = useSessionGuard();
  const screenResolution = useScreenResolution();
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingByUsRef = useRef(false);

  const [status, setStatus] = useState<
    "idle" | "connecting" | "open" | "closed"
  >("idle");

  const isConnected = status === "open";
  const isConnecting = status === "connecting";

  // * ========
  // * Heartbeat
  // * ========
  const startHeartbeat = (ws: WebSocket) => {
    stopHeartbeat();
    pingTimerRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ kind: "ping", ts: Date.now() }));
      }
    }, 20000);
  };

  const stopHeartbeat = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  // * ========
  // * Disconnect
  // * ========
  const disconnect = useCallback(
    (reason = "user disconnect") => {
      const ws = wsRef.current;
      if (!ws) return;

      try {
        closingByUsRef.current = true;
        stopHeartbeat();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              kind: "control",
              op: "goodbye",
              payload: { reason },
            })
          );
        }
        ws.close(1000, reason);
      } catch {
        // ignore
      }
    },
    [stopHeartbeat]
  );

  // Cleanup al desmontar o si cambia la sesión
  useEffect(() => {
    return () => {
      disconnect("unmount");
    };
  }, [disconnect, session?.id]);

  // * ========
  // * Connect
  // * ========
  const connect = async () => {
    try {
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        toast.info("Ya conectado o conectando…");
        return;
      }

      setStatus("connecting");

      const meta = buildClientMetaWithResolution(screenResolution, {
        label: "leonobitech",
        path: "/api/leonobit",
      });

      const res = await fetch("/api/leonobit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ meta, user, session }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);

      const token = data.token as string | undefined;
      if (!token) throw new Error("Token no recibido");

      const domain = process.env.NEXT_PUBLIC_WS_ORIGIN;
      if (!domain) throw new Error("Falta NEXT_PUBLIC_WS_ORIGIN");

      const ws = new WebSocket(`${domain}/ws/leonobit/offer`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ kind: "auth", token }));
        startHeartbeat(ws);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.kind === "ready") {
            setStatus("open");
            toast.success("Conectado ✅", { icon: "🚀", duration: 1200 });
          } else if (msg.kind === "pong") {
            // opcional: medir RTT con msg.ts
          } else {
            console.log("📩 WS:", msg);
          }
        } catch {
          console.debug("WS non-JSON:", e.data);
        }
      };

      ws.onerror = () => {
        if (closingByUsRef.current) return;
        toast.error("Error al conectar WebSocket");
        setStatus("idle");
      };

      let closedOnce = false;
      ws.onclose = (evt) => {
        if (closedOnce) return;
        closedOnce = true;

        stopHeartbeat();
        wsRef.current = null;
        setStatus("closed");

        if (closingByUsRef.current) {
          closingByUsRef.current = false;
          return;
        }
        closingByUsRef.current = false;

        console.info("WebSocket cerrado", {
          code: evt.code,
          reason: evt.reason || undefined,
        });
      };
    } catch (err) {
      setStatus("idle");
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
      console.error(msg);
    }
  };

  // * ========
  // * Handler único del botón
  // * ========
  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center">
          <Button
            onClick={handleClick}
            size="lg"
            className={`w-full sm:w-auto flex items-center justify-center gap-2 text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg
              ${
                isConnected
                  ? "bg-red-600 hover:bg-red-700"
                  : isConnecting
                  ? "bg-gray-500 cursor-wait"
                  : "bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600"
              }`}
            disabled={loading || isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <PhoneOff className="mr-2 h-4 w-4" />
                Disconnect
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Connect
              </>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
