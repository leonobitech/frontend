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

// ===================== Client-only (evita SSR del Canvas) =====================
const CosmicBioCore = dynamic(
  () => import("@/components/CosmicBioCore").then((m) => m.CosmicBioCore),
  { ssr: false, loading: () => null }
);

// ===================== Tipado de mensajes del servidor (WebSocket) ============
type ServerMsg =
  | { kind: "ready" }
  | { kind: "webrtc.answer"; sdp: string }
  | { kind: "webrtc.candidate"; candidate: RTCIceCandidateInit }
  | { kind: "pong"; ts?: number }
  | { kind: "error"; message: string }
  | { kind: "notice"; message: string }
  | { kind: "stt.partial"; text: string }  // Fallback cuando DC no disponible
  | { kind: "stt.final"; text: string };   // Fallback cuando DC no disponible

// ===================== Tipado de mensajes STT (DataChannel chat) ==============
type SttMsg =
  | { kind: "stt.partial"; text: string }
  | { kind: "stt.final"; text: string };

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
  switch (v.kind) {
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
    case "stt.partial":
    case "stt.final":
      return typeof v.text === "string";
    default:
      return false;
  }
};

const isSttMsg = (v: unknown): v is SttMsg => {
  if (!isRecord(v)) return false;
  switch (v.kind) {
    case "stt.partial":
    case "stt.final":
      return typeof v.text === "string";
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

// ============================================================================
//                               Componente Page
// ============================================================================
export default function LeonobitPage() {
  // --- sesión y meta cliente ---
  const { user, session, loading } = useSessionGuard();
  const screenResolution = useScreenResolution();

  // --- WS refs / flags ---
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closingByUsRef = useRef(false);
  const connectingLockRef = useRef(false);

  // --- WebRTC hook / peer vivo ---
  const { prepare } = usePreparedWebRTC();
  const peerRef = useRef<PreparedPeer | null>(null);

  // --- audio remoto oculto ---
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- estado UI ---
  const [status, setStatus] = useState<
    "idle" | "connecting" | "open" | "closed"
  >("idle");
  const isConnected = status === "open";

  // --- mic animación visual ---
  const [micOn, setMicOn] = useState(false);
  const [micPerm, setMicPerm] = useState<
    "idle" | "granted" | "denied" | "error" | "insecure"
  >("idle");
  const [level, setLevel] = useState(0); // 0..1

  // --- refs para apagar mic de verdad ---
  const remoteAudioStreamRef = useRef<MediaStream | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // --- RTT por DC ctrl ---
  const rttMsRef = useRef<number | null>(null);
  const [rttMs, setRttMs] = useState<number | null>(null);

  // --- Estado de transcripciones (NUEVO para streaming) ---
  const [partialText, setPartialText] = useState<string>("");
  const [finalTexts, setFinalTexts] = useState<string[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const lastPingTsRef = useRef<number | null>(null);
  const dcPingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ==========================================================================
  // WS Heartbeat (ping/pong app-level; independiente de WebRTC)
  // ==========================================================================
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

  // ==========================================================================
  // Helpers para iniciar / detener el ping por DC ctrl (RTT)
  // ==========================================================================
  const startDcPing = useCallback((peer: PreparedPeer) => {
    // Limpieza defensiva
    if (dcPingTimerRef.current) {
      clearInterval(dcPingTimerRef.current);
      dcPingTimerRef.current = null;
    }
    lastPingTsRef.current = null;
    rttMsRef.current = null;
    setRttMs(null);

    // Handler: respuesta "pong:<ts>" desde el backend (eco)
    peer.channels.ctrl.onmessage = (ev) => {
      const data = String(ev.data ?? "");
      if (data.startsWith("pong:")) {
        const sent = Number(data.slice(5));
        if (!Number.isNaN(sent)) {
          const rtt = Date.now() - sent;
          rttMsRef.current = rtt;
          setRttMs(rtt);
          // console.debug(`[dc:ctrl] RTT ${rtt} ms`);
        }
      } else {
        // otros mensajes de control
        // console.debug("[dc:ctrl] msg:", data);
      }
    };

    // Función ping
    const sendPing = () => {
      const ts = Date.now();
      lastPingTsRef.current = ts;
      try {
        peer.channels.ctrl.send(`ping:${ts}`);
      } catch (e) {
        console.warn("[dc:ctrl] send ping error:", e);
      }
    };

    // Watchdog: si pasan >6s sin pong, marcar stale
    const checkStale = () => {
      const last = lastPingTsRef.current;
      if (last && Date.now() - last > 6000) {
        rttMsRef.current = null;
        setRttMs(null);
      }
    };

    // Al abrir el canal, comenzar a pingear
    peer.channels.ctrl.onopen = () => {
      console.log("[dc:ctrl] open");
      sendPing(); // primer ping inmediato
      dcPingTimerRef.current = setInterval(() => {
        sendPing();
        checkStale();
      }, 2000);
    };

    // Si el canal ya llegó a open, disparar manualmente el flujo
    if (peer.channels.ctrl.readyState === "open") {
      // simular onopen
      peer.channels.ctrl.onopen?.(new Event("open"));
    }

    // Log de cierre (opcional)
    peer.channels.ctrl.onclose = () => {
      console.log("[dc:ctrl] close");
    };
  }, []);

  const stopDcPing = useCallback(() => {
    if (dcPingTimerRef.current) {
      clearInterval(dcPingTimerRef.current);
      dcPingTimerRef.current = null;
    }
    lastPingTsRef.current = null;

    // limpiar handlers del canal ctrl sin usar `any`
    const p = peerRef.current;
    if (p) {
      p.channels.ctrl.onmessage = null;
      p.channels.ctrl.onopen = null;
      p.channels.ctrl.onclose = null;
    }

    rttMsRef.current = null;
    setRttMs(null);
  }, []);

  // Pausar pings cuando la pestaña queda en background (throttling de timers)
  useEffect(() => {
    const onVis = () => {
      const p = peerRef.current;
      if (!p) return;
      if (document.visibilityState === "hidden") {
        stopDcPing();
      } else if (p.channels.ctrl.readyState === "open") {
        startDcPing(p);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [startDcPing, stopDcPing]);

  // ==========================================================================
  // Apagar mic inmediatamente (tracks + nodos + AudioContext)
  // ==========================================================================
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

  // ==========================================================================
  // Disconnect (cierre ordenado WS + WebRTC + limpieza UI)
  // ==========================================================================
  const disconnect = useCallback(
    (reason = "user disconnect") => {
      // 1) WebRTC
      try {
        peerRef.current?.close();
      } catch {}
      peerRef.current = null;

      // 2) DC ping + audio UI
      stopDcPing();
      setStatus("closed");
      setMicOn(false);
      void stopMicNow();

      // 3) WebSocket
      const ws = wsRef.current; // <-- capturamos la referencia
      if (!ws) return;

      try {
        closingByUsRef.current = true;
        stopHeartbeat();

        // Limpia handlers para que no ejecuten durante el cierre
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;

        // Si está OPEN, mandamos goodbye
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              kind: "control",
              op: "goodbye",
              payload: { reason },
            })
          );
        }

        // Cerrar después de un tick (o dos) con la **referencia capturada**
        const closeReason = reason.slice(0, 123); // el spec limita a 123 bytes
        setTimeout(() => {
          try {
            if (
              ws.readyState === WebSocket.OPEN ||
              ws.readyState === WebSocket.CONNECTING
            ) {
              ws.close(1000, closeReason);
            }
          } catch {}
          // ahora sí, limpiamos el ref global
          wsRef.current = null;
          closingByUsRef.current = false;
          connectingLockRef.current = false;
        }, 10);
      } catch {
        // ignore
        wsRef.current = null;
        closingByUsRef.current = false;
        connectingLockRef.current = false;
      }
    },
    [stopDcPing, stopHeartbeat, stopMicNow]
  );

  useEffect(() => {
    return () => {
      disconnect("unmount");
    };
  }, [disconnect, session?.id]);

  // ==========================================================================
  // Connect (WS + señalización + WebRTC)
  // ==========================================================================
  const connect = async () => {
    try {
      if (connectingLockRef.current) return; // evita doble conexión
      connectingLockRef.current = true;

      // defensivo: si ya hay un peer viejo, cerrarlo primero
      if (peerRef.current) {
        try {
          peerRef.current.close();
        } catch {}
        stopDcPing();
        peerRef.current = null;
      }

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

      // =================== Señalización + estados ========================
      ws.onmessage = async (e) => {
        const msg = await parseServerMsg(e.data);
        if (!msg) {
          console.debug("WS non-JSON o formato desconocido:", e.data);
          return;
        }

        if (msg.kind === "ready") {
          // 1) Preparar RTCPeerConnection y callbacks
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
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play().catch(() => {});
              }
            },
          });

          // DataChannel chat: recibe transcripciones STT
          peer.channels.chat.onopen = () => {
            console.log("[dc:chat] open - listo para recibir transcripciones");
          };

          peer.channels.chat.onmessage = (ev) => {
            try {
              const data = String(ev.data);
              const parsed: unknown = JSON.parse(data);

              if (!isSttMsg(parsed)) {
                console.log("[dc:chat] mensaje no-STT:", data);
                return;
              }

              if (parsed.kind === "stt.partial") {
                console.log("[STT partial via DC]", parsed.text);
                setPartialText(parsed.text);
                setIsListening(true);
              } else if (parsed.kind === "stt.final") {
                console.log("[STT final via DC]", parsed.text);
                setFinalTexts(prev => [...prev, parsed.text]);
                setPartialText("");
                setIsListening(false);
                toast.success(`Transcrito: ${parsed.text}`, { duration: 3000 });
              }
            } catch (err) {
              // Si no es JSON válido, ignorar
              console.warn("[dc:chat] JSON inválido:", err);
            }
          };

          // DataChannel binary (para futuros usos)
          peer.channels.binary.onopen = () => console.log("[dc:binary] open");

          peerRef.current = peer;

          // 2) Medición de RTT sobre el ctrl
          startDcPing(peer);

          // 3) Enviar offer → backend
          ws.send(
            JSON.stringify({ kind: "webrtc.offer", sdp: peer.offer.sdp })
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

        // STT: Fallback por WebSocket cuando DataChannel no está disponible
        if (msg.kind === "stt.partial") {
          console.log("[STT partial via WS fallback]", msg.text);
          setPartialText(msg.text);
          setIsListening(true);
          return;
        }

        if (msg.kind === "stt.final") {
          console.log("[STT final via WS fallback]", msg.text);
          setFinalTexts(prev => [...prev, msg.text]);
          setPartialText("");
          setIsListening(false);
          toast.success(`Transcrito: ${msg.text}`, { duration: 3000 });
          return;
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

        stopDcPing();

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

  // ==========================================================================
  // UI: conectar / desconectar
  // ==========================================================================
  const handleClick = () => {
    if (isConnected) disconnect();
    else connect();
  };

  // ==========================================================================
  // MIC visual (RMS)
  // ==========================================================================
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

  // ==========================================================================
  // Render
  // ==========================================================================
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
              externalLevel={micPerm === "granted" && micOn ? level : undefined}
            />
            {/* Etiqueta de estado */}
            <p
              className="mt-3 text-center text-sm sm:text-base text-slate-300/80"
              role="status"
              aria-live="polite"
            >
              {uiStatus === "connecting" ? "Conectando…" : "Conectado"}
            </p>
            {/* RTT (siempre visible; muestra stale) */}
            <p className="mt-1 text-center text-xs text-slate-400/80">
              RTT (DC): {rttMs != null ? `${rttMs} ms` : "— (sin respuesta)"}
            </p>
          </div>
        </div>
      )}

      {/* Transcripciones en tiempo real (NUEVO) */}
      {uiStatus !== "closed" && (finalTexts.length > 0 || partialText || isListening) && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-slate-700/50 pointer-events-auto">
            {/* Indicador de escucha */}
            {isListening && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex gap-1">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-emerald-400 font-medium">Escuchando...</span>
              </div>
            )}

            {/* Transcripciones finales */}
            <div className="max-h-[40vh] overflow-y-auto space-y-2 mb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {finalTexts.map((text, i) => (
                <div
                  key={i}
                  className="text-slate-100 text-sm sm:text-base leading-relaxed animate-fadeIn"
                >
                  {text}
                </div>
              ))}
            </div>

            {/* Transcripción parcial (mientras habla) */}
            {partialText && (
              <div className="text-indigo-300/90 text-sm sm:text-base leading-relaxed italic flex items-center gap-2 animate-fadeIn">
                <span>{partialText}</span>
                <span className="inline-block w-1 h-4 bg-indigo-400 animate-pulse" />
              </div>
            )}

            {/* Botón para limpiar */}
            {finalTexts.length > 0 && (
              <button
                onClick={() => setFinalTexts([])}
                className="mt-4 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Limpiar historial
              </button>
            )}
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
