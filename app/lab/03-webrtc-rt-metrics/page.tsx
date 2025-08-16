"use client";

/**
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ Lab 03 — WebRTC RT Metrics (Cliente)                                  │
 * ├───────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                               │
 * │ - Establecer una conexión WebRTC con el backend usando señalización    │
 * │   HTTP (JWT en cookies/session) y un DataChannel **no negociado**.     │
 * │ - Medir RTT (latencia ida y vuelta) de PINGs manuales enviados por el  │
 * │   cliente y devolver ECHO silencioso para PINGs keepalive del server.  │
 * │ - Mostrar métricas (min/p50/p90/p95/p99/max/mean) en tiempo real.      │
 * ├───────────────────────────────────────────────────────────────────────┤
 * │ Puntos clave                                                            │
 * │ 1) DataChannel "rt-metrics" lo crea el cliente (no negociado),         │
 * │    el servidor lo recibe en on_data_channel.                           │
 * │ 2) PINGs del servidor: respondemos con ECHO (sin log).                  │
 * │    PINGs manuales (cliente): medimos RTT y lo mostramos.                │
 * │ 3) Esperamos ICE gathering "completo" (o timeout) antes de enviar la   │
 * │    SDP offer al backend para reducir renegociaciones innecesarias.      │
 * │ 4) Limpiezas defensivas: cerramos DC/PC en errores, unmount y reconex. │
 * └───────────────────────────────────────────────────────────────────────┘
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

import { StatusBadge } from "@/components/labs/ws/StatusBadge";
import { Controls } from "@/components/labs/ws/Controls";
import {
  StatsGridRT,
  type MetricsRT,
} from "@/components/labs/webrtc/StatsGridRT";

type Status = "idle" | "connecting" | "open" | "closed" | "error";

/** Normaliza un error (Error | string | unknown) a mensaje legible. */
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

/**
 * Espera a que el ICE gathering termine o vence por timeout.
 * Devuelve si completó y el SDP local (si existe).
 *
 * Por qué importa: enviar el offer con la mayor cantidad de candidatos
 * reduce ida/vueltas de señalización y acelera el "open" del DC.
 */
async function waitIceGatheringComplete(
  pc: RTCPeerConnection,
  timeoutMs = 3500
): Promise<{ completed: boolean; sdp: string | null }> {
  let timer: number | null = null;

  if (pc.iceGatheringState === "complete") {
    return { completed: true, sdp: pc.localDescription?.sdp ?? null };
  }

  const completed = await new Promise<boolean>((resolve) => {
    const onState = () => {
      if (pc.iceGatheringState === "complete") {
        if (timer) window.clearTimeout(timer);
        pc.removeEventListener("icegatheringstatechange", onState);
        resolve(true);
      }
    };
    pc.addEventListener("icegatheringstatechange", onState);
    timer = window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", onState);
      resolve(false);
    }, timeoutMs);
  });

  return { completed, sdp: pc.localDescription?.sdp ?? null };
}

export default function Lab03WebRTCMetricsPage() {
  /**
   * ─────────────────────────────────────────────────────────────────────
   * Autenticación / sesión:
   * - useSessionGuard garantiza que el usuario esté logueado y nos da
   *   `user`, `session` y `loading` (para bloquear ciertas acciones).
   * ─────────────────────────────────────────────────────────────────────
   */
  const { user, session, loading } = useSessionGuard();

  /**
   * ─────────────────────────────────────────────────────────────────────
   * Estado de UI + buffers:
   * - `status`: estado amigable de la conexión para la UI.
   * - `messages`: log visible (máx 500 líneas, las más recientes).
   * - `rtts`: lista de RTTs de PINGs **manuales** (para métricas).
   * - `input`: campo de texto para enviar payloads RAW por DC.
   * ─────────────────────────────────────────────────────────────────────
   */
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<string[]>([]);
  const [rtts, setRtts] = useState<number[]>([]);
  const [input, setInput] = useState("");

  /**
   * ─────────────────────────────────────────────────────────────────────
   * RTCPeerConnection / RTCDataChannel:
   * - Se guardan en refs para sobrevivir re-renders sin re-crear objetos.
   * - `pending`: timestamps de PINGs manuales a la espera de su ECHO.
   * ─────────────────────────────────────────────────────────────────────
   */
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const pending = useRef<Set<number>>(new Set()); // PINGs manuales

  /**
   * Calcula métricas P50/P90/P95/P99 en tiempo real.
   * Nota: se deriva de `rtts`, evita recomputar si no cambia.
   */
  const metrics: MetricsRT | null = useMemo(() => {
    if (rtts.length === 0) return null;
    const sorted = [...rtts].sort((a, b) => a - b);
    const q = (p: number) =>
      sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))];
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    return {
      count: rtts.length,
      min: sorted[0],
      p50: q(0.5),
      p90: q(0.9),
      p95: q(0.95),
      p99: q(0.99),
      max: sorted[sorted.length - 1],
      mean,
    };
  }, [rtts]);

  /** Apila mensajes en el área de log con límite de 500. */
  const pushMsg = (m: string) =>
    setMessages((arr) => {
      const next = [...arr, m];
      if (next.length > 500) next.shift();
      return next;
    });

  /**
   * ┌───────────────────────────────────────────────────────────────┐
   * │ connect(): flujo de señalización + creación de DC             │
   * └───────────────────────────────────────────────────────────────┘
   * 1) Limpieza defensiva por si había un PC/DC previo.
   * 2) Crea RTCPeerConnection con 2 STUN públicos.
   * 3) Crea DataChannel "rt-metrics" (cliente-side, no negociado).
   * 4) Settea handlers (ICE/conn/DC events).
   * 5) Genera Offer SDP, espera ICE gathering (o timeout).
   * 6) POST a señalización → recibe Answer y la aplica.
   * 7) Si algo falla, status=error y cierra todo.
   */
  async function connect() {
    // (1) Limpieza dura antes de crear otro PC
    try {
      dcRef.current?.close();
    } catch {}
    try {
      pcRef.current?.close();
    } catch {}
    dcRef.current = null;
    pcRef.current = null;

    setStatus("connecting");
    try {
      // Meta de cliente (útil para logs del backend)
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const meta = {
        ...buildClientMetaWithResolution(screenRes, { label: "leonobitech" }),
        path: "/lab/03-webrtc-rt-metrics",
        method: "POST",
      } as const;

      // (2) RTCPeerConnection + STUNs
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302"] },
          { urls: ["stun:stun.cloudflare.com:3478"] },
        ],
      });
      pcRef.current = pc;

      // Eventos de conectividad ICE/PC → ayudan a entender el ciclo de vida
      pc.oniceconnectionstatechange = () => {
        pushMsg(`ICE → ${pc.iceConnectionState}`);
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          setStatus("closed");
        }
      };
      pc.onconnectionstatechange = () => {
        pushMsg(`PC → ${pc.connectionState}`);
      };
      pc.onicecandidateerror = (ev: RTCPeerConnectionIceErrorEvent) => {
        const { errorCode, errorText, url, address, port } = ev;
        pushMsg(
          `❌ ICE error: code=${errorCode} text=${errorText ?? ""} url=${
            url ?? ""
          } addr=${address ?? ""} port=${port ?? ""}`
        );
      };

      // (3) DataChannel no negociado — el servidor lo verá en on_data_channel
      const dc = pc.createDataChannel("rt-metrics");
      dcRef.current = dc;

      // (4) Handlers del DC: open/close/error/message
      dc.onopen = () => {
        setStatus("open");
        pushMsg("📡 DC abierto");
      };
      dc.onclose = () => {
        setStatus("closed");
        pushMsg("🔌 DC cerrado");
      };
      dc.onerror = (ev) => {
        const msg =
          (ev as unknown as { error?: { message?: string } })?.error?.message ??
          getErrorMessage(ev);
        setStatus("error");
        pushMsg("⚠️ DC error: " + msg);
      };

      /**
       * (5) Mensajería:
       * - Si llega {kind:"PING", t}: es keepalive del server → respondemos ECHO (silencioso).
       * - Si llega {kind:"ECHO", t} y ese "t" está en `pending`: medimos RTT, lo graficamos y
       *   lo sacamos de `pending`. ECHOs ajenos se ignoran para no contaminar métricas.
       * - Payloads no-JSON o distintos a lo esperado → ignorar (evitamos ruido).
       */
      dc.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          const kind: unknown = parsed?.kind;
          const t: unknown = parsed?.t;

          if (kind === "PING" && typeof t === "number") {
            // Keepalive del server → responder ECHO sin log
            try {
              dc.send(JSON.stringify({ kind: "ECHO", t }));
            } catch {}
            return;
          }

          if (kind === "ECHO" && typeof t === "number") {
            if (pending.current.has(t)) {
              pending.current.delete(t);
              const rtt = Math.abs(Date.now() - t);
              setRtts((arr) => {
                const next = [...arr, rtt];
                if (next.length > 2000) next.shift();
                return next;
              });
              pushMsg(`ECHO ← ${rtt.toFixed(1)} ms`);
            }
            return; // ECHO ajenos: ignorar
          }

          // Cualquier otro payload lo ignoramos para no spamear
        } catch {
          // Ignorar no-JSON
        }
      };

      // (6) SDP: offer local (audio/video off) + espera ICE gather para enviar al backend
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      const waited = await waitIceGatheringComplete(pc, 4000);
      const localSdp = waited.sdp ?? pc.localDescription?.sdp ?? null;
      if (!localSdp)
        throw new Error("No local SDP available after ICE gathering");

      // Señalización HTTP → backend devuelve Answer SDP
      const resp = await fetch("/api/lab/03-webrtc-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          meta,
          user,
          session,
          offer: { type: "offer", sdp: localSdp },
        }),
      });

      if (!resp.ok) {
        // Puede venir HTML/texto → parse defensivo
        const raw = await resp.text();
        let msg = "";
        try {
          msg = (JSON.parse(raw)?.message as string) ?? raw;
        } catch {
          msg = raw;
        }
        throw new Error(`Signaling failed: ${resp.status} ${msg}`);
      }

      const answer = (await resp.json()) as { sdp: string; type: string };
      await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });

      pushMsg("✅ Conectado (DataChannel no-negociado)");
    } catch (e) {
      // (7) Manejo de error + limpieza
      setStatus("error");
      pushMsg("❌ Error de conexión: " + getErrorMessage(e));
      try {
        dcRef.current?.close();
      } catch {}
      try {
        pcRef.current?.close();
      } catch {}
      dcRef.current = null;
      pcRef.current = null;
    }
  }

  /**
   * Cierra DC y PC de forma segura y deja la UI en "closed".
   * Útil para controles manuales o reconectar limpio.
   */
  function disconnect() {
    try {
      dcRef.current?.close();
    } catch {}
    try {
      pcRef.current?.close();
    } catch {}
    dcRef.current = null;
    pcRef.current = null;
    setStatus("closed");
    pushMsg("🔌 Desconectado");
  }

  /**
   * Envío de texto RAW por el DataChannel (solo para pruebas).
   * No interviene en métricas; es útil para inspección manual.
   */
  function sendText() {
    const txt = input.trim();
    const dc = dcRef.current;
    if (!txt) return;
    if (!dc) {
      pushMsg("⚠️ No hay DC");
      return;
    }
    if (dc.readyState !== "open") {
      pushMsg(`⚠️ DC no está open (${dc.readyState})`);
      return;
    }
    try {
      dc.send(txt);
      pushMsg("RAW → " + txt); // mostramos SOLO al enviar texto
      setInput("");
    } catch (e) {
      pushMsg("⚠️ Envío fallido: " + getErrorMessage(e));
    }
  }

  /**
   * Cleanup en desmontaje del componente:
   * garantiza que no queden sockets/peers abiertos si se navega a otra página.
   */
  useEffect(() => {
    return () => {
      try {
        dcRef.current?.close();
      } catch {}
      try {
        pcRef.current?.close();
      } catch {}
      dcRef.current = null;
      pcRef.current = null;
    };
  }, []);

  /**
   * ─────────────────────────────────────────────────────────────────────
   * UI: Controles, estado y tablero de métricas
   * - Controls dispara connect/disconnect y PING manual.
   * - StatusBadge refleja el estado current del DC/PC.
   * - StatsGridRT muestra percentiles y conteo de RTTs.
   * - Log (pre) recoge eventos clave de la sesión.
   * ─────────────────────────────────────────────────────────────────────
   */
  return (
    <div className="font-sans p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Lab 03 — WebRTC RT Metrics</h1>

      {/* Resumen didáctico del flujo de la demo */}
      <p className="mb-4 text-gray-600">
        Señalización HTTP (JWT) → DataChannel <code>rt-metrics</code> (no
        negociado). Server envía PING; cliente responde silencioso y sólo
        muestra RTT de PING manual.
      </p>

      <Controls
        url={"https://leonobit.leonobitech.com/webrtc/lab/03/offer"}
        setUrl={() => {}}
        onConnect={connect}
        onDisconnect={disconnect}
        onPing={() => {
          const dc = dcRef.current;
          if (!dc) {
            pushMsg("⚠️ No hay DC");
            return;
          }
          if (dc.readyState !== "open") {
            pushMsg(`⚠️ DC no está open (${dc.readyState})`);
            return;
          }
          try {
            // PING manual → sólo éste se medirá y mostrará (guardamos t)
            const t = Date.now();
            pending.current.add(t);
            dc.send(JSON.stringify({ kind: "PING", t }));
            pushMsg("PING → manual");
          } catch (e) {
            pushMsg("⚠️ Ping fallido: " + getErrorMessage(e));
          }
        }}
        disabled={loading || status === "connecting"}
        placeholder={"/webrtc/lab/03/offer"}
      />

      <div className="mt-3 flex items-center gap-3">
        Estado: <StatusBadge status={status} />
        <StatsGridRT m={metrics} />
      </div>

      {/* Envío RAW por DC para pruebas rápidas */}
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="(Opcional) mensaje raw por DataChannel"
        />
        <button
          onClick={sendText}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-900 text-white"
        >
          Enviar
        </button>
      </div>

      {/* Log de eventos: estados ICE/PC/DC, ECHOs y errores */}
      <pre className="mt-4 bg-gray-900 text-blue-100 p-4 rounded-lg min-h-[280px] max-h-[460px] overflow-y-auto whitespace-pre-wrap break-words border border-gray-800">
        {messages.join("\n")}
      </pre>
    </div>
  );
}
