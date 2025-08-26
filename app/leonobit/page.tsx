"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { useScreenResolution } from "@/hooks/useScreenResolution";
import { ConnectButton } from "@/components/ui/ConnectButton/ConnectButton";
import { Bubble } from "@/components/ui/Bubble/Bubble";

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

  // ===== Heartbeat (ping/pong) =====
  const startHeartbeat = (ws: WebSocket) => {
    stopHeartbeat();
    pingTimerRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ kind: "ping", ts: Date.now() }));
      }
    }, 20_000);
  };

  const stopHeartbeat = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  // ===== Disconnect =====
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

  // ===== Connect =====
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

      // 1) Solicita token
      const res = await fetch("/api/leonobit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ meta, user, session }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);

      const token = data?.token as string | undefined;
      if (!token) throw new Error("Token no recibido");

      // 2) Abre WS
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

      // onerror: solo muestra error si NO cerramos nosotros
      ws.onerror = () => {
        if (closingByUsRef.current) return;
        toast.error("Error al conectar WebSocket");
        setStatus("idle");
      };

      // onclose: cleanup + silencio si cerramos nosotros
      let closedOnce = false;
      ws.onclose = (evt) => {
        if (closedOnce) return;
        closedOnce = true;

        stopHeartbeat();
        wsRef.current = null;
        setStatus("closed");

        if (closingByUsRef.current) {
          closingByUsRef.current = false;
          return; // no log ruidoso
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

  // ===== Handler único (Connect/Disconnect) =====
  const handleClick = () => {
    if (isConnected) disconnect();
    else connect();
  };

  // Mapear status de página → status visual del botón
  const uiStatus: "open" | "connecting" | "closed" =
    status === "open"
      ? "open"
      : status === "connecting"
      ? "connecting"
      : "closed";

  return (
    <main className="relative min-h-[100dvh] px-4">
      {/* Bubble centrada SOLO cuando open */}
      {uiStatus === "open" && (
        <section className="absolute inset-0 grid place-items-center pointer-events-none animate-[fade-in_300ms_ease_forwards]">
          <Bubble size="md" status="open" />
        </section>
      )}

      {/* Botón fijo abajo */}
      <section className="absolute left-1/2 -translate-x-1/2 bottom-[18vh] sm:bottom-[22vh] lg:bottom-[16vh]">
        <ConnectButton
          status={uiStatus}
          onClick={handleClick}
          disabled={loading || status === "connecting"}
        />
      </section>
    </main>
  );
}
