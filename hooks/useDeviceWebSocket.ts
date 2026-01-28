"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// =============================================================================
// Types - Matching Backend Protocol
// =============================================================================

export type WsConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export interface LightState {
  intensity: number; // 0-100
  temperature: number; // 0-100 (0=warm, 100=cool)
  mode: "manual" | "auto";
}

export interface DeviceTelemetry {
  deviceId: string;
  freeHeap: number;
  wifiRssi: number;
  uptimeSecs: number;
  timestamp: number;
}

export interface SchedulePoint {
  hour: number;
  minute: number;
  intensity: number;
  temperature: number;
}

// Incoming messages from server
type IncomingMessage =
  | { type: "welcome"; connectionId: string; serverTime: number }
  | { type: "error"; code: string; message: string }
  | { type: "device_connected"; deviceId: string }
  | { type: "device_disconnected"; deviceId: string }
  | {
      type: "light_state";
      deviceId: string;
      intensity: number;
      temperature: number;
      mode: "manual" | "auto";
    }
  | {
      type: "telemetry";
      deviceId: string;
      freeHeap: number;
      wifiRssi: number;
      uptimeSecs: number;
      timestamp: number;
    }
  | { type: "ack"; deviceId: string; messageId?: string; success: boolean; error?: string }
  | { type: "pong"; deviceId: string; timestamp: number; serverTimestamp: number };

// Outgoing messages to server
type OutgoingMessage =
  | { type: "set_light"; deviceId: string; intensity: number; temperature: number }
  | { type: "set_mode"; deviceId: string; mode: "manual" | "auto" }
  | { type: "sync_schedule"; deviceId: string; schedule: SchedulePoint[] }
  | { type: "request_state"; deviceId: string }
  | { type: "ping"; deviceId: string; timestamp: number };

// =============================================================================
// Hook Options
// =============================================================================

interface UseDeviceWebSocketOptions {
  deviceId: string;
  wsUrl?: string;
  autoConnect?: boolean;
  reconnectDelay?: number;
  onError?: (code: string, message: string) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useDeviceWebSocket({
  deviceId,
  wsUrl,
  autoConnect = true,
  reconnectDelay = 5000,
  onError,
}: UseDeviceWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manualDisconnectRef = useRef(false);

  const [connectionState, setConnectionState] =
    useState<WsConnectionState>("disconnected");
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);
  const [lightState, setLightState] = useState<LightState>({
    intensity: 0,
    temperature: 50,
    mode: "manual",
  });
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Build WebSocket URL
  const getWsUrl = useCallback(() => {
    if (wsUrl) return wsUrl;

    // Use backend API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    if (apiUrl) {
      // Convert http(s) to ws(s)
      const wsProtocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
      const host = apiUrl.replace(/^https?:\/\//, "");
      return `${wsProtocol}//${host}/ws/iot/dashboard`;
    }

    // Fallback: Use same origin as current page (for local development)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws/iot/dashboard`;
  }, [wsUrl]);

  // Handle incoming message
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as IncomingMessage;

        switch (message.type) {
          case "welcome":
            // Request current state after connecting
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({ type: "request_state", deviceId })
              );
            }
            break;

          case "error":
            setLastError(`${message.code}: ${message.message}`);
            onError?.(message.code, message.message);
            break;

          case "device_connected":
            if (message.deviceId === deviceId) {
              setIsDeviceOnline(true);
            }
            break;

          case "device_disconnected":
            if (message.deviceId === deviceId) {
              setIsDeviceOnline(false);
            }
            break;

          case "light_state":
            if (message.deviceId === deviceId) {
              setIsDeviceOnline(true);
              setLightState({
                intensity: message.intensity,
                temperature: message.temperature,
                mode: message.mode,
              });
            }
            break;

          case "telemetry":
            if (message.deviceId === deviceId) {
              setIsDeviceOnline(true);
              setTelemetry(message);
            }
            break;

          case "ack":
            // ACK received - could track pending commands
            break;

          case "pong":
            // Pong received - could track latency
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    },
    [deviceId, onError]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    manualDisconnectRef.current = false;
    setConnectionState("connecting");
    setLastError(null);

    const url = getWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState("connected");
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      setConnectionState("disconnected");

      // Auto-reconnect if not manually disconnected
      if (!manualDisconnectRef.current) {
        setConnectionState("reconnecting");
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      }
    };

    ws.onerror = () => {
      setLastError("WebSocket connection error");
    };
  }, [getWsUrl, handleMessage, reconnectDelay]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setConnectionState("disconnected");
  }, []);

  // Send message helper
  const sendMessage = useCallback((message: OutgoingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // =============================================================================
  // Public API Methods
  // =============================================================================

  // Set light intensity and temperature
  const setLight = useCallback(
    (intensity: number, temperature: number) => {
      const success = sendMessage({
        type: "set_light",
        deviceId,
        intensity: Math.round(Math.max(0, Math.min(100, intensity))),
        temperature: Math.round(Math.max(0, Math.min(100, temperature))),
      });

      // Optimistic update
      if (success) {
        setLightState((prev) => ({
          ...prev,
          intensity: Math.round(intensity),
          temperature: Math.round(temperature),
        }));
      }

      return success;
    },
    [deviceId, sendMessage]
  );

  // Set light mode (manual/auto)
  const setMode = useCallback(
    (mode: "manual" | "auto") => {
      const success = sendMessage({
        type: "set_mode",
        deviceId,
        mode,
      });

      // Optimistic update
      if (success) {
        setLightState((prev) => ({ ...prev, mode }));
      }

      return success;
    },
    [deviceId, sendMessage]
  );

  // Sync schedule to device
  const syncSchedule = useCallback(
    (schedule: SchedulePoint[]) => {
      return sendMessage({
        type: "sync_schedule",
        deviceId,
        schedule,
      });
    },
    [deviceId, sendMessage]
  );

  // Request current state from device
  const requestState = useCallback(() => {
    return sendMessage({
      type: "request_state",
      deviceId,
    });
  }, [deviceId, sendMessage]);

  // =============================================================================
  // Lifecycle
  // =============================================================================

  useEffect(() => {
    if (autoConnect && deviceId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, deviceId, connect, disconnect]);

  // =============================================================================
  // Return Value
  // =============================================================================

  return useMemo(
    () => ({
      // Connection state
      connectionState,
      isConnected: connectionState === "connected",
      isDeviceOnline,
      lastError,

      // Device state
      lightState,
      telemetry,

      // Actions
      connect,
      disconnect,
      setLight,
      setMode,
      syncSchedule,
      requestState,
    }),
    [
      connectionState,
      isDeviceOnline,
      lastError,
      lightState,
      telemetry,
      connect,
      disconnect,
      setLight,
      setMode,
      syncSchedule,
      requestState,
    ]
  );
}
