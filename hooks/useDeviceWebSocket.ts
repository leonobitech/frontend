"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

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
  | { type: "pong"; deviceId: string; timestamp: number; serverTimestamp: number }
  | {
      type: "command_ack";
      deviceId: string;
      commandId: string;
      action: string;
      success: boolean;
      result?: Record<string, unknown>;
      error?: string;
    }
  | { type: "session_expired"; reason: "token_expired" | "session_revoked" | "logout" };

// Outgoing messages to server
type OutgoingMessage =
  | { type: "set_light"; deviceId: string; intensity: number; temperature: number }
  | { type: "set_mode"; deviceId: string; mode: "manual" | "auto" }
  | { type: "sync_schedule"; deviceId: string; schedule: SchedulePoint[] }
  | { type: "request_state"; deviceId: string }
  | { type: "ping"; deviceId: string; timestamp: number }
  | { type: "command"; deviceId: string; action: string; params?: Record<string, unknown> };

// =============================================================================
// Hook Options
// =============================================================================

export interface CommandAck {
  commandId: string;
  action: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

interface UseDeviceWebSocketOptions {
  deviceId: string;
  wsUrl?: string;
  autoConnect?: boolean;
  reconnectDelay?: number;
  onError?: (code: string, message: string) => void;
  onCommandAck?: (ack: CommandAck) => void;
  onSessionExpired?: (reason: string) => void;
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
  onCommandAck,
  onSessionExpired,
}: UseDeviceWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manualDisconnectRef = useRef(false);

  // Latest-ref pattern: store callbacks and deviceId in refs so
  // handleMessage never changes and doesn't destabilize connect/useEffect
  const deviceIdRef = useRef(deviceId);
  const onErrorRef = useRef(onError);
  const onCommandAckRef = useRef(onCommandAck);
  const onSessionExpiredRef = useRef(onSessionExpired);

  // Keep refs in sync
  useEffect(() => {
    deviceIdRef.current = deviceId;
  }, [deviceId]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onCommandAckRef.current = onCommandAck;
  }, [onCommandAck]);
  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

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
  const [lastCommandAck, setLastCommandAck] = useState<CommandAck | null>(null);

  // Build WebSocket URL (with optional token)
  const getWsUrl = useCallback((token?: string) => {
    if (wsUrl) return token ? `${wsUrl}?token=${token}` : wsUrl;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    if (apiUrl) {
      const wsProtocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
      const host = apiUrl.replace(/^https?:\/\//, "");
      const baseUrl = `${wsProtocol}//${host}/ws/iot/dashboard`;
      return token ? `${baseUrl}?token=${token}` : baseUrl;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const baseUrl = `${protocol}//${host}/ws/iot/dashboard`;
    return token ? `${baseUrl}?token=${token}` : baseUrl;
  // wsUrl is a config option that doesn't change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch WebSocket token via same-origin Next.js proxy
  const fetchWsToken = useCallback(async (): Promise<string | null> => {
    try {
      const screenResolution = typeof window !== "undefined"
        ? `${window.screen.width}x${window.screen.height}`
        : "";

      const meta = buildClientMetaWithResolution(screenResolution, {
        label: "leonobitech",
      });

      const response = await fetch("/api/iot/ws-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ meta }),
      });

      if (!response.ok) {
        console.error("Failed to fetch WS token:", response.status);
        return null;
      }

      const data = await response.json();
      return data.token || null;
    } catch (error) {
      console.error("Error fetching WS token:", error);
      return null;
    }
  }, []);

  // Handle incoming message - STABLE (no deps, reads from refs)
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as IncomingMessage;
        const currentDeviceId = deviceIdRef.current;

        switch (message.type) {
          case "welcome":
            // Request current state after connecting
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({ type: "request_state", deviceId: currentDeviceId })
              );
            }
            break;

          case "error":
            setLastError(`${message.code}: ${message.message}`);
            onErrorRef.current?.(message.code, message.message);
            break;

          case "device_connected":
            if (message.deviceId === currentDeviceId) {
              setIsDeviceOnline(true);
            }
            break;

          case "device_disconnected":
            if (message.deviceId === currentDeviceId) {
              setIsDeviceOnline(false);
            }
            break;

          case "light_state":
            if (message.deviceId === currentDeviceId) {
              setIsDeviceOnline(true);
              setLightState({
                intensity: message.intensity,
                temperature: message.temperature,
                mode: message.mode,
              });
            }
            break;

          case "telemetry":
            if (message.deviceId === currentDeviceId) {
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

          case "command_ack": {
            const ack: CommandAck = {
              commandId: message.commandId,
              action: message.action,
              success: message.success,
              result: message.result,
              error: message.error,
            };
            setLastCommandAck(ack);
            onCommandAckRef.current?.(ack);
            break;
          }

          case "session_expired":
            // Session expired - disconnect without reconnecting
            manualDisconnectRef.current = true;
            onSessionExpiredRef.current?.(message.reason);
            wsRef.current?.close(4001, "Session expired");
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    },
    [] // No deps - reads everything from refs
  );

  // Connect to WebSocket - STABLE (handleMessage is stable)
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    manualDisconnectRef.current = false;
    setConnectionState("connecting");
    setLastError(null);

    // Fetch token for WebSocket auth (needed for Safari cross-subdomain)
    const token = await fetchWsToken();

    // Guard: if disconnect was called while fetching token, abort
    if (manualDisconnectRef.current) {
      setConnectionState("disconnected");
      return;
    }

    const url = getWsUrl(token || undefined);
    console.log("Connecting to WebSocket:", url.replace(/token=.*/, "token=***"));

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
  }, [getWsUrl, fetchWsToken, handleMessage, reconnectDelay]);

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
        deviceId: deviceIdRef.current,
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
    [sendMessage]
  );

  // Set light mode (manual/auto)
  const setMode = useCallback(
    (mode: "manual" | "auto") => {
      const success = sendMessage({
        type: "set_mode",
        deviceId: deviceIdRef.current,
        mode,
      });

      // Optimistic update
      if (success) {
        setLightState((prev) => ({ ...prev, mode }));
      }

      return success;
    },
    [sendMessage]
  );

  // Sync schedule to device
  const syncSchedule = useCallback(
    (schedule: SchedulePoint[]) => {
      return sendMessage({
        type: "sync_schedule",
        deviceId: deviceIdRef.current,
        schedule,
      });
    },
    [sendMessage]
  );

  // Request current state from device
  const requestState = useCallback(() => {
    return sendMessage({
      type: "request_state",
      deviceId: deviceIdRef.current,
    });
  }, [sendMessage]);

  // Send a command to device (restart, get_status, led_on, led_off, etc.)
  const sendCommand = useCallback(
    (action: string, params?: Record<string, unknown>) => {
      return sendMessage({
        type: "command",
        deviceId: deviceIdRef.current,
        action,
        params,
      });
    },
    [sendMessage]
  );

  // =============================================================================
  // Lifecycle - Only depends on autoConnect and deviceId (stable)
  // =============================================================================

  useEffect(() => {
    if (autoConnect && deviceId) {
      connect();
    }

    return () => {
      disconnect();
    };
  // connect and disconnect are stable (all deps are stable refs/callbacks)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, deviceId]);

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
      lastCommandAck,

      // Actions
      connect,
      disconnect,
      setLight,
      setMode,
      syncSchedule,
      requestState,
      sendCommand,
    }),
    [
      connectionState,
      isDeviceOnline,
      lastError,
      lightState,
      telemetry,
      lastCommandAck,
      connect,
      disconnect,
      setLight,
      setMode,
      syncSchedule,
      requestState,
      sendCommand,
    ]
  );
}
