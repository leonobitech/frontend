"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { useScreenResolution } from "@/hooks/useScreenResolution";
import { ConnectButton } from "@/components/ui/ConnectButton/ConnectButton";
import dynamic from "next/dynamic";

// Carga client-only (evita SSR del Canvas)
const HoloHalo = dynamic(
  () => import("@/components/scene/HoloHalo").then((m) => m.HoloHalo),
  { ssr: false, loading: () => null }
);

export default function LeonobitPage() {
  const { user, session, loading } = useSessionGuard();
  const screenResolution = useScreenResolution();

  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingByUsRef = useRef(false);
  const connectingLockRef = useRef(false);

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

  // ===== Disconnect (teardown primero, luego WS) =====
  const disconnect = useCallback(
    (reason = "user disconnect") => {
      const ws = wsRef.current;
      // 1) Desmonta HoloOrb YA (evita pintar tras teardown)
      setStatus("closed");

      if (!ws) return;

      try {
        closingByUsRef.current = true;

        // 2) Corta heartbeat y anula handlers
        stopHeartbeat();
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;

        // 3) Aviso de salida si sigue abierto
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              kind: "control",
              op: "goodbye",
              payload: { reason },
            })
          );
        }

        // 4) Cierra y limpia ref inmediatamente (evita carreras)
        ws.close(1000, reason);
      } catch {
        /* ignore */
      } finally {
        wsRef.current = null;
        closingByUsRef.current = false;
        connectingLockRef.current = false;
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
      // Lock anti-spam
      if (connectingLockRef.current) return;
      connectingLockRef.current = true;

      // Evitar abrir dos veces (OPEN o CONNECTING)
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        toast.info("Ya conectado o conectando…");
        connectingLockRef.current = false;
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

        // Si no fuimos nosotros, informa; el HoloOrb ya está desmontado si llamaste disconnect()
        if (!closingByUsRef.current) {
          console.info("WebSocket cerrado", {
            code: evt.code,
            reason: evt.reason || undefined,
          });
          setStatus((s) => (s === "open" ? "closed" : s)); // seguridad
        }
        closingByUsRef.current = false;
        connectingLockRef.current = false;
      };

      // éxito: el lock se libera cuando cierra o al error; si abre bien y llega "ready",
      // quedamos en "open" y el lock ya no molesta.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
      console.error(msg);
      setStatus("idle");
      wsRef.current = null;
      connectingLockRef.current = false;
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
      {uiStatus !== "closed" && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <HoloHalo
              status={uiStatus} // "open" | "connecting" | "closed"
              onClick={disconnect}
              className="shadow-xl shadow-cyan-500/10"
              sizePx={420}
              radius={1.2}
            />
          </div>
        </div>
      )}

      {/* Botón centrado abajo en estado cerrado (sin cambios) */}
      {uiStatus === "closed" && (
        <section className="absolute left-1/2 -translate-x-1/2 bottom-[12vh] sm:bottom-[14vh] lg:bottom-[18vh] z-20">
          <ConnectButton
            status={uiStatus as "closed" | "connecting"}
            onClick={handleClick}
            disabled={loading || status === "connecting"}
          />
        </section>
      )}
    </main>
  );
}
