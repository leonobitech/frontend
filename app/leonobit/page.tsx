"use client";
import { useEffect, useRef, useState, useCallback } from "react";
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
  const closingByUsRef = useRef(false);

  const [status, setStatus] = useState<
    "idle" | "connecting" | "open" | "closed"
  >("idle");

  const isConnected = status === "open";
  const isConnecting = status === "connecting";

  // * ========
  // * Send Ping
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
        stopHeartbeat(); // corta el ping ya
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
      disconnect("unmount"); // cierre limpio
    };
  }, [disconnect, session?.id]);

  // * ========
  // * Connect
  // * ========
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

      // 2) onerror vuelve a idle (por si falla handshake)
      ws.onerror = () => {
        if (closingByUsRef.current) {
          // cierre iniciado por nosotros → no muestres error
          return;
        }
        toast.error("Error al conectar WebSocket");
        setStatus("idle");
      };

      // 3) cleanup SOLO en onclose
      let closedOnce = false;
      ws.onclose = (evt) => {
        if (closedOnce) return; // ← evita doble ejecución
        closedOnce = true;

        stopHeartbeat();
        wsRef.current = null;
        setStatus("closed");

        if (closingByUsRef.current) {
          closingByUsRef.current = false; // reset
          return; // cierre propio: no loguear (1006 es común)
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

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={connect}
            size="sm"
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
                     dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
                     text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
            disabled={loading || isConnecting || isConnected}
          >
            <Mic className="mr-2 h-4 w-4" />
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? "Connected"
              : "Connect"}
          </Button>

          <Button
            onClick={() => disconnect()}
            size="sm"
            variant="secondary"
            disabled={!isConnected && !isConnecting && !wsRef.current}
            className="w-full sm:w-auto transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            <PhoneOff className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </div>
    </main>
  );
}
