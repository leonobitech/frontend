"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { useScreenResolution } from "@/hooks/useScreenResolution";
import { ConnectButton } from "@/components/ui/ConnectButton/ConnectButton";
import dynamic from "next/dynamic";
import {
  usePreparedWebRTC,
  type PreparedPeer,
} from "@/hooks/webrtc/usePreparedWebRTC";

// Carga client-only (evita SSR del Canvas)
const CosmicBioCore = dynamic(
  () => import("@/components/CosmicBioCore").then((m) => m.CosmicBioCore),
  { ssr: false, loading: () => null }
);

// ===== Señalización tipada (sin any) ===================================================================
type ServerMsg =
  | { kind: "ready" }
  | { kind: "webrtc.answer"; sdp: string }
  | { kind: "webrtc.candidate"; candidate: RTCIceCandidateInit }
  | { kind: "pong"; ts?: number }
  | { kind: "error"; message: string }
  | { kind: "notice"; message: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isRtcCandidateInit = (v: unknown): v is RTCIceCandidateInit => {
  if (!isRecord(v)) return false;
  const hasCand = typeof v.candidate === "string";
  const hasMid = typeof v.sdpMid === "string" || v.sdpMid == null;
  const hasIdx = typeof v.sdpMLineIndex === "number" || v.sdpMLineIndex == null;
  return hasCand || hasMid || hasIdx;
};

const isServerMsg = (v: unknown): v is ServerMsg => {
  if (!isRecord(v)) return false;
  const k = v.kind;
  switch (k) {
    case "ready":
      return true;
    case "webrtc.answer":
      return typeof v.sdp === "string";
    case "webrtc.candidate":
      return isRtcCandidateInit(v.candidate);
    case "pong":
      return v.ts === undefined || typeof v.ts === "number";
    case "error":
    case "notice":
      return typeof v.message === "string";
    default:
      return false;
  }
};

// Acepta string o Blob (algunos WS envían Blob)
const parseServerMsg = async (data: unknown): Promise<ServerMsg | null> => {
  try {
    const text =
      typeof data === "string"
        ? data
        : data instanceof Blob
        ? await data.text()
        : null;
    if (text == null) return null;
    const obj: unknown = JSON.parse(text);
    return isServerMsg(obj) ? obj : null;
  } catch {
    return null;
  }
};

//=========================================================================================================
export default function LeonobitPage() {
  const { user, session, loading } = useSessionGuard();
  const screenResolution = useScreenResolution();

  // Guardar la conexión WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // Ping/Pong
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Flags internos
  const closingByUsRef = useRef(false);
  const connectingLockRef = useRef(false);

  // WebRTC
  const { prepare } = usePreparedWebRTC();

  // Guardar la conexión WebRTC
  const peerRef = useRef<PreparedPeer | null>(null);

  // Controlar el <audio> oculto
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [status, setStatus] = useState<
    "idle" | "connecting" | "open" | "closed"
  >("idle");
  const isConnected = status === "open";

  // ===== MIC (sólo para animación visual) =====
  const [micOn, setMicOn] = useState(false);
  const [micPerm, setMicPerm] = useState<
    "idle" | "granted" | "denied" | "error" | "insecure"
  >("idle");
  const [level, setLevel] = useState(0); // 0..1

  // Refs para apagar el mic de verdad (Safari)
  // Guardar streams y nodos de audio
  const remoteAudioStreamRef = useRef<MediaStream | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

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

  // 🔹 Apagar mic inmediatamente (tracks + nodos + AudioContext)
  const stopMicNow = useCallback(async () => {
    try {
      srcNodeRef.current?.disconnect();
    } catch {}
    try {
      analyserRef.current?.disconnect();
    } catch {}
    analyserRef.current = null;
    srcNodeRef.current = null;

    try {
      const s = mediaStreamRef.current;
      if (s) s.getTracks().forEach((t) => t.stop()); // <- clave en Safari
    } catch {}
    mediaStreamRef.current = null;

    try {
      await audioCtxRef.current?.suspend();
    } catch {}
    try {
      await audioCtxRef.current?.close();
    } catch {}
    audioCtxRef.current = null;
  }, []);

  // ===== Disconnect =====
  const disconnect = useCallback(
    (reason = "user disconnect") => {
      // WebRTC primero
      try {
        peerRef.current?.close();
      } catch {}
      peerRef.current = null;

      // Audio remoto
      try {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = null;
        }
        remoteAudioStreamRef.current = null;
      } catch {}

      // UI y mic visual
      setStatus("closed");
      setMicOn(false);
      void stopMicNow();

      // WebSocket
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
    [stopHeartbeat, stopMicNow]
  );

  useEffect(() => {
    return () => {
      disconnect("unmount");
    };
  }, [disconnect, session?.id]);

  // ===== Connect (WS + señalización + WebRTC) ==============================================
  const connect = async () => {
    try {
      if (connectingLockRef.current) return; // evita doble conexión
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

      // Abrir conexion WS con auth (jwt)
      ws.onopen = () => {
        ws.send(JSON.stringify({ kind: "auth", token }));
        startHeartbeat(ws);
      };

      // =================== Señalización + estados =======================================================
      ws.onmessage = async (e) => {
        const msg = await parseServerMsg(e.data);
        if (!msg) {
          console.debug("WS non-JSON o formato desconocido:", e.data);
          return;
        }

        if (msg.kind === "ready") {
          // 🚀 Inicializa RTCPeerConnection: crea oferta y configura callbacks de señalización
          // 🔹 Preparar conexión WebRTC y enviar candidatos ICE locales
          const peer = await prepare({
            audio: { enabled: true },
            onLocalCandidate: (cand) => {
              ws.send(
                JSON.stringify({ kind: "webrtc.candidate", candidate: cand })
              );
            },
            onConnectionState: (s) => {
              if (s === "connected") {
                setStatus("open");
                toast.success("Conectado ✅", { icon: "🚀", duration: 1200 });
                setMicOn(true);
              }
            },
            onRemoteTrack: (ev) => {
              const stream =
                ev.streams?.[0] ??
                remoteAudioStreamRef.current ??
                new MediaStream();
              if (!ev.streams?.length) stream.addTrack(ev.track);
              remoteAudioStreamRef.current = stream;
              if (remoteAudioRef.current) {
                // Permite asignar srcObject dinámicamente:
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play().catch(() => {});
              }
            },
          });

          peer.channels.ctrl.onopen = () => console.log("[dc:ctrl] open");
          peer.channels.chat.onopen = () => console.log("[dc:chat] open");
          peer.channels.binary.onopen = () => console.log("[dc:binary] open");
          peer.channels.ctrl.onmessage = (ev) =>
            console.log("[dc:ctrl]", ev.data);
          peer.channels.chat.onmessage = (ev) =>
            console.log("[dc:chat]", ev.data);

          peerRef.current = peer;

          // envia offer al backend
          ws.send(
            JSON.stringify({
              kind: "webrtc.offer",
              sdp: peer.offer.sdp, // <-- Aquí viaja la SDP
            })
          );
          return;
        }

        if (msg.kind === "webrtc.answer") {
          await peerRef.current?.applyRemoteAnswer(msg.sdp);
          return;
        }

        if (msg.kind === "webrtc.candidate") {
          await peerRef.current?.addRemoteIce(msg.candidate);
          return;
        }

        if (msg.kind === "pong") {
          return; // opcional
        }

        if (msg.kind === "notice") {
          console.info("[WS notice]", msg.message);
          return;
        }

        if (msg.kind === "error") {
          console.error("[WS error]", msg.message);
          toast.error(msg.message);
          return;
        }
      };
      //===================================================================================================

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

        // Cierra también WebRTC
        try {
          peerRef.current?.close();
        } catch {}
        peerRef.current = null;

        if (!closingByUsRef.current) {
          console.info("WebSocket cerrado", {
            code: evt.code,
            reason: evt.reason || undefined,
          });
          setStatus((s) => (s === "open" ? "closed" : s));
        }
        setMicOn(false);
        void stopMicNow();

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

  // ===== MIC visual (RMS) =====
  useEffect(() => {
    if (!micOn) return;

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setMicPerm("insecure");
      setMicOn(false);
      return;
    }

    let mounted = true;
    let raf = 0;

    const onPageHide = () => {
      void stopMicNow();
    };
    const onBeforeUnload = () => {
      void stopMicNow();
    };

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

        const ctx = new AudioContextCtor();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        mediaStreamRef.current = stream;

        const src = ctx.createMediaStreamSource(stream);
        srcNodeRef.current = src;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;
        src.connect(analyser);

        setMicPerm("granted");

        const data = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          if (!mounted || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          let sum = 0;
          const n = data.length;
          for (let i = 0; i < n; i++) sum += data[i] * data[i];
          const rms = Math.sqrt(sum / n) / 255; // 0..1
          setLevel((prev) => prev * 0.85 + rms * 0.15);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("beforeunload", onBeforeUnload);
      } catch {
        setMicPerm("denied");
        setMicOn(false);
        await stopMicNow();
        return;
      }
    })();

    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void stopMicNow();
    };
  }, [micOn, stopMicNow]);

  // Mapear al status visual del botón
  const uiStatus: "open" | "connecting" | "closed" =
    status === "open"
      ? "open"
      : status === "connecting"
      ? "connecting"
      : "closed";

  return (
    <main className="relative min-h-[100dvh] px-4">
      {/* audio remoto oculto */}
      <audio ref={remoteAudioRef} autoPlay playsInline hidden />

      {uiStatus !== "closed" && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <CosmicBioCore
              status={uiStatus}
              onClick={disconnect}
              quality="high"
              useMic={false} // seguimos usando el mic de la página
              externalLevel={micOn && micPerm === "granted" ? level : undefined}
            />
            {/* Etiqueta de estado */}
            <p
              className="mt-3 text-center text-sm sm:text-base text-slate-300/80"
              role="status"
              aria-live="polite"
            >
              {uiStatus === "connecting" ? "Conectando…" : "Conectado"}
            </p>
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
