"use client";
import { useEffect, useRef } from "react";

export function useMicLevel(enabled: boolean): number {
  const levelRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null); // ← cambio 1

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    let ctx: AudioContext | null = null;
    let raf = 0;

    (async () => {
      try {
        const AudioContextCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        ctx = new AudioContextCtor();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        analyserRef.current = analyser;

        // ← cambio 2: buffer estrictamente ArrayBuffer (no ArrayBufferLike)
        dataRef.current = new Uint8Array(
          new ArrayBuffer(analyser.frequencyBinCount)
        );

        const loop = () => {
          if (!mounted || !analyserRef.current || !dataRef.current) return;
          analyserRef.current.getByteFrequencyData(dataRef.current);
          let sum = 0;
          const arr = dataRef.current;
          for (let i = 0; i < arr.length; i++) sum += arr[i] * arr[i];
          const rms = Math.sqrt(sum / arr.length) / 255;
          levelRef.current = levelRef.current * 0.85 + rms * 0.15;
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch {}
    })();

    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
      try {
        ctx?.close();
      } catch {}
      analyserRef.current = null;
      dataRef.current = null;
    };
  }, [enabled]);

  return levelRef.current;
}
