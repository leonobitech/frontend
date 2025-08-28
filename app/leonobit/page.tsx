"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { useScreenResolution } from "@/hooks/useScreenResolution";
import { ConnectButton } from "@/components/ui/ConnectButton/ConnectButton";
import dynamic from "next/dynamic";

// Carga client-only (evita SSR del Canvas)
const CosmicBioCore = dynamic(
  () => import("@/components/scene/CosmicBioCore").then((m) => m.CosmicBioCore),
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

  // ===== MIC (sólo para animación) =====
  const [micOn, setMicOn] = useState(false);
  const [micPerm, setMicPerm] = useState<
    "idle" | "granted" | "denied" | "error" | "insecure"
  >("idle");
  const [level, setLevel] = useState(0); // 0..1

  // ===== Heartbeat =====
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
      // 1) desmontar visual y mic
      setStatus("closed");
      setMicOn(false);

      const ws = wsRef.current;
      if (!ws) return;

      try {
        closingByUsRef.current = true;
        stopHeartbeat();
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;

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
        /* ignore */
      } finally {
        wsRef.current = null;
        closingByUsRef.current = false;
        connectingLockRef.current = false;
      }
    },
    [stopHeartbeat]
  );

  useEffect(() => {
    return () => {
      disconnect("unmount");
    };
  }, [disconnect, session?.id]);

  // ===== Connect =====
  const connect = async () => {
    try {
      if (connectingLockRef.current) return;
      connectingLockRef.current = true;

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
            // 🔹 activar mic sólo para la animación
            setMicOn(true);
          } else if (msg.kind === "pong") {
            // opcional
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

        if (!closingByUsRef.current) {
          console.info("WebSocket cerrado", {
            code: evt.code,
            reason: evt.reason || undefined,
          });
          setStatus((s) => (s === "open" ? "closed" : s));
        }
        // 🔹 apagar mic al cerrar
        setMicOn(false);

        closingByUsRef.current = false;
        connectingLockRef.current = false;
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
      console.error(msg);
      setStatus("idle");
      wsRef.current = null;
      connectingLockRef.current = false;
    }
  };

  // ===== Handler Connect/Disconnect =====
  const handleClick = () => {
    if (isConnected) disconnect();
    else connect();
  };

  // ===== MIC: pedir permiso y medir RMS (sin enviar por WS) =====
  useEffect(() => {
    if (!micOn) return;

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setMicPerm("insecure");
      setMicOn(false);
      return;
    }

    let mounted = true;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;
    let raf = 0;

    (async () => {
      try {
        const AudioContextCtor: { new (): AudioContext } =
          "AudioContext" in window
            ? window.AudioContext
            : (
                window as unknown as {
                  webkitAudioContext: { new (): AudioContext };
                }
              ).webkitAudioContext;

        ctx = new AudioContextCtor();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        const src = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);

        // Buffer tipado para evitar TS2345
        data = new Uint8Array(
          analyser.frequencyBinCount
        ) as unknown as Uint8Array<ArrayBuffer>;
        setMicPerm("granted");

        const loop = () => {
          if (!mounted || !analyser || !data) return;

          analyser.getByteFrequencyData(data);
          let sum = 0;
          const n = data.length;
          for (let i = 0; i < n; i++) sum += data[i] * data[i];
          const rms = Math.sqrt(sum / n) / 255; // 0..1

          // suavizado
          setLevel((prev) => prev * 0.85 + rms * 0.15);

          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        // Cortar tracks si se deja la página
        const stopTracks = () => stream.getTracks().forEach((t) => t.stop());
        window.addEventListener("pagehide", stopTracks);
        window.addEventListener("beforeunload", stopTracks);
      } catch {
        setMicPerm("denied");
        setMicOn(false);
      }
    })();

    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
      try {
        ctx?.close();
      } catch {
        /* noop */
      }
      analyser = null;
      data = null;
    };
  }, [micOn]);

  // Mapear al status visual del botón
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
            <CosmicBioCore
              status={uiStatus}
              onClick={disconnect}
              quality="high"
              useMic={false} // no usamos mic interno
              externalLevel={level} // nivel del mic de la página
            />
          </div>
        </div>
      )}

      {uiStatus === "closed" && (
        <section className="absolute left-1/2 -translate-x-1/2 bottom-[12vh] sm:bottom-[14vh] lg:bottom-[18vh] z-20">
          <ConnectButton
            status={uiStatus as "closed" | "connecting"}
            onClick={handleClick}
            disabled={loading || status === "connecting"}
          />
        </section>
      )}

      {micPerm === "insecure" && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-amber-300/80">
          El micrófono requiere HTTPS (o localhost).
        </p>
      )}
      {micPerm === "denied" && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-rose-300/80">
          Permiso de micrófono denegado. Revisá los ajustes del navegador.
        </p>
      )}
    </main>
  );
}
