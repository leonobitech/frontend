"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Mic, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScreenResolution } from "@/hooks/useScreenResolution";

export default function LeonobitPage() {
  const { user, session, loading } = useSessionGuard();
  const screenResolution = useScreenResolution();
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<
    "idle" | "connecting" | "open" | "closed"
  >("idle");

  const isConnected = status === "open";
  const isConnecting = status === "connecting";

  const startHeartbeat = (ws: WebSocket) => {
    stopHeartbeat();
    pingTimerRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ kind: "ping", ts: Date.now() }));
      }
    }, 20000);
  };

  const stopHeartbeat = () => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  };

  const disconnect = (reason = "user disconnect") => {
    const ws = wsRef.current;
    if (!ws) return;

    try {
      // Mensaje opcional de despedida/plano de control
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            kind: "control",
            op: "goodbye",
            payload: { reason },
          })
        );
      }
      // Cierre limpio
      ws.close(1000, reason);
    } catch {
      // ignore
    } finally {
      stopHeartbeat();
      wsRef.current = null;
      setStatus("closed");
      toast.message("Desconectado");
    }
  };

  const connect = async () => {
    try {
      // Evitar abrir dos veces (OPEN o CONNECTING)
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

      // 1) Pide token
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

      // 2) Abre WS (wss:// en prod)
      const domain = process.env.NEXT_PUBLIC_WS_ORIGIN; // ej: wss://core.leonobitech.com
      if (!domain) throw new Error("Falta NEXT_PUBLIC_WS_ORIGIN");
      const ws = new WebSocket(`${domain}/ws/leonobit/offer`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("open");
        ws.send(JSON.stringify({ kind: "auth", token }));
        startHeartbeat(ws);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.kind === "ready") {
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
        toast.error("Error al conectar WebSocket");
      };

      ws.onclose = (evt) => {
        stopHeartbeat();
        wsRef.current = null;
        setStatus("closed");
        console.log("WebSocket cerrado", {
          code: evt.code,
          reason: evt.reason,
        });
      };
    } catch (err) {
      setStatus("idle");
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
      console.error(msg);
    }
  };

  // Cleanup al desmontar o si cambia la sesión
  useEffect(() => {
    return () => disconnect("unmount");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={connect}
        size="sm"
        className="bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
                   dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
                   text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
        disabled={loading || isConnecting || isConnected}
      >
        <Mic className="mr-2 h-4 w-4" />
        {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Connect"}
      </Button>

      <Button
        onClick={() => disconnect()}
        size="sm"
        variant="secondary"
        disabled={!isConnected && !isConnecting && !wsRef.current}
        className="transition-all duration-300 ease-in-out transform hover:scale-105"
      >
        <PhoneOff className="mr-2 h-4 w-4" />
        Disconnect
      </Button>
    </div>
  );
}
