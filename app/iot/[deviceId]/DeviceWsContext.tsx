"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useDeviceWebSocket, type CommandAck } from "@/hooks/useDeviceWebSocket";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DeviceWsContextValue = ReturnType<typeof useDeviceWebSocket>;

const DeviceWsContext = createContext<DeviceWsContextValue | null>(null);

export function useDeviceWs(): DeviceWsContextValue {
  const ctx = useContext(DeviceWsContext);
  if (!ctx) {
    throw new Error("useDeviceWs must be used within DeviceWsProvider");
  }
  return ctx;
}

/**
 * Try to use the shared WS context. Returns null if not inside a DeviceWsProvider.
 * Useful for components that can work both standalone and within the provider.
 */
export function useOptionalDeviceWs(): DeviceWsContextValue | null {
  return useContext(DeviceWsContext);
}

interface DeviceWsProviderProps {
  deviceId: string;
  children: ReactNode;
}

export function DeviceWsProvider({ deviceId, children }: DeviceWsProviderProps) {
  const router = useRouter();

  const onCommandAck = useCallback((ack: CommandAck) => {
    if (ack.success) {
      toast.success(`Comando "${ack.action}" ejecutado`);
    } else {
      toast.error(`Comando "${ack.action}" fallo: ${ack.error || "Error desconocido"}`);
    }
  }, []);

  const onSessionExpired = useCallback(
    (reason: string) => {
      toast.error(
        reason === "logout"
          ? "Sesion cerrada desde otra pestaña"
          : "Sesion expirada, inicia sesion de nuevo"
      );
      router.push("/login");
    },
    [router]
  );

  const ws = useDeviceWebSocket({
    deviceId,
    onCommandAck,
    onSessionExpired,
  });

  return (
    <DeviceWsContext.Provider value={ws}>
      {children}
    </DeviceWsContext.Provider>
  );
}
