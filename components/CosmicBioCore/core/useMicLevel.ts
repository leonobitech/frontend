"use client";
import { useEffect, useRef, useState } from "react";

export function useMicLevel(enabled: boolean): number {
  const [level, setLevel] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setLevel(0);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        // Constructor compatible (AudioContext o webkitAudioContext) SIN any
        const AudioContextCtor: (new () => AudioContext) | undefined =
          (window as unknown as { webkitAudioContext?: new () => AudioContext })
            .webkitAudioContext ?? window.AudioContext;

        if (!AudioContextCtor) {
          setLevel(0);
          return;
        }

        const ctx = new AudioContextCtor();
        ctxRef.current = ctx;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        streamRef.current = stream;

        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        analyserRef.current = analyser;

        // Buffer correcto (sin ArrayBufferLike)
        const data = new Uint8Array(analyser.frequencyBinCount);

        const loop = () => {
          if (!mounted || !analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
          const rms = Math.sqrt(sum / data.length) / 255; // 0..1

          // suavizado (easing) + repaint
          setLevel((prev) => prev * 0.85 + rms * 0.15);

          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch {
        setLevel(0);
      }
    })();

    return () => {
      mounted = false;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;

      try {
        analyserRef.current?.disconnect();
      } catch {}
      analyserRef.current = null;

      try {
        const s = streamRef.current;
        if (s) s.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;

      const ctx = ctxRef.current;
      if (ctx) {
        // cerramos el contexto de forma segura
        ctx.close().catch(() => {});
      }
      ctxRef.current = null;

      setLevel(0);
    };
  }, [enabled]);

  return enabled ? level : 0;
}
