"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface ScheduleSyncContextValue {
  syncedPreset: string | null;
  setSyncedPreset: (name: string | null) => void;
  clearSyncedPreset: () => void;
}

const ScheduleSyncContext = createContext<ScheduleSyncContextValue | null>(null);

export function useScheduleSync(): ScheduleSyncContextValue {
  const ctx = useContext(ScheduleSyncContext);
  if (!ctx) throw new Error("useScheduleSync must be used within ScheduleSyncProvider");
  return ctx;
}

export function useOptionalScheduleSync(): ScheduleSyncContextValue | null {
  return useContext(ScheduleSyncContext);
}

interface ScheduleSyncProviderProps {
  deviceId: string;
  children: ReactNode;
}

export function ScheduleSyncProvider({ deviceId, children }: ScheduleSyncProviderProps) {
  const storageKey = `synced-preset-${deviceId}`;

  const [syncedPreset, setSyncedPresetState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(storageKey) || null;
  });

  useEffect(() => {
    if (syncedPreset) {
      localStorage.setItem(storageKey, syncedPreset);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [syncedPreset, storageKey]);

  const setSyncedPreset = useCallback((name: string | null) => {
    setSyncedPresetState(name);
  }, []);

  const clearSyncedPreset = useCallback(() => {
    setSyncedPresetState(null);
  }, []);

  return (
    <ScheduleSyncContext.Provider value={{ syncedPreset, setSyncedPreset, clearSyncedPreset }}>
      {children}
    </ScheduleSyncContext.Provider>
  );
}
