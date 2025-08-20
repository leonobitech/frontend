// hooks/webrtc/useAudioDevices.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { hasSetSinkId } from "@/components/labs/webrtc/utils";

export function useAudioDevices(
  audioRef?: React.RefObject<HTMLAudioElement | null>
) {
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(
    "default"
  );

  const supportsSetSinkId = useMemo(
    () =>
      typeof HTMLMediaElement !== "undefined" &&
      "setSinkId" in HTMLMediaElement.prototype &&
      typeof window !== "undefined" &&
      window.isSecureContext,
    []
  );

  const enumerateAudioDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setInputDevices(all.filter((d) => d.kind === "audioinput"));
      setOutputDevices(all.filter((d) => d.kind === "audiooutput"));
    } catch (e) {
      console.warn("enumerateDevices failed:", e);
    }
  }, []);

  useEffect(() => {
    void enumerateAudioDevices();
    const onDeviceChange = () => void enumerateAudioDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.(
        "devicechange",
        onDeviceChange
      );
    };
  }, [enumerateAudioDevices]);

  const handleChangeOutput = useCallback(
    async (id: string) => {
      setSelectedOutputId(id);
      if (!supportsSetSinkId) return;
      const el = audioRef?.current ?? null;
      if (!el || !hasSetSinkId(el)) return;
      try {
        await (
          el as HTMLMediaElement & { setSinkId(id: string): Promise<void> }
        ).setSinkId(id);
      } catch (err) {
        console.warn("setSinkId failed:", err);
      }
    },
    [audioRef, supportsSetSinkId]
  );

  const canConnect = inputDevices.length > 0;

  return {
    // estado
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    supportsSetSinkId,
    canConnect,
    // setters/acciones
    setSelectedInputId,
    handleChangeOutput,
    enumerateAudioDevices,
  };
}
