"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Signal,
  RefreshCw,
  Send,
  Thermometer,
  Droplets,
  Gauge,
  Clock,
  Activity,
} from "lucide-react";

import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LightControl } from "@/components/iot/LightControl";
import { DeviceWsProvider, useDeviceWs } from "./DeviceWsContext";

import type { IotDevice, IotTelemetry, ChipInfo } from "@/types/iot";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

interface DeviceDetailResponse {
  device: IotDevice;
  telemetry: IotTelemetry[];
}

async function fetchDeviceDetail(
  deviceId: string
): Promise<DeviceDetailResponse> {
  const screenResolution = typeof window !== "undefined"
    ? `${window.screen.width}x${window.screen.height}`
    : "unknown";
  const meta = buildClientMetaWithResolution(screenResolution, { label: "iot-device-detail" });

  const res = await fetch(`/api/iot/devices/${deviceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "get", meta }),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch device");
  }
  return res.json();
}

// Sensor icon mapping
function getSensorIcon(key: string) {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("temp")) return <Thermometer className="w-4 h-4" />;
  if (lowerKey.includes("humid")) return <Droplets className="w-4 h-4" />;
  if (lowerKey.includes("press")) return <Gauge className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
}

// Format sensor value
function formatSensorValue(key: string, value: number | string | boolean) {
  if (typeof value === "boolean") return value ? "On" : "Off";
  if (typeof value === "number") {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("temp")) return `${value.toFixed(1)}°C`;
    if (lowerKey.includes("humid")) return `${value.toFixed(1)}%`;
    if (lowerKey.includes("press")) return `${value.toFixed(0)} hPa`;
    return value.toFixed(2);
  }
  return String(value);
}

interface PageProps {
  params: Promise<{ deviceId: string }>;
}

export default function DeviceDetailPage({ params }: PageProps) {
  const { deviceId } = use(params);
  const { user, loading: authLoading } = useSessionGuard();

  // Fetch device info and telemetry history (initial load only, no polling)
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["iot-device", deviceId],
    queryFn: () => fetchDeviceDetail(deviceId),
    enabled: !!user && !!deviceId,
    refetchInterval: false,
    staleTime: 30000,
  });

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!user || !data) {
    return null;
  }

  return (
    <DeviceWsProvider deviceId={data.device.deviceId}>
      <DeviceDetailContent
        device={data.device}
        telemetry={data.telemetry}
        isFetching={isFetching}
        refetch={refetch}
      />
    </DeviceWsProvider>
  );
}

// =============================================================================
// Inner Component (has access to DeviceWsContext)
// =============================================================================

interface DeviceDetailContentProps {
  device: IotDevice;
  telemetry: IotTelemetry[];
  isFetching: boolean;
  refetch: () => void;
}

function DeviceDetailContent({
  device,
  telemetry,
  isFetching,
  refetch,
}: DeviceDetailContentProps) {
  const { isDeviceOnline, isConnected, telemetry: wsTelemetry, lastCommandAck, sendCommand } = useDeviceWs();
  const [commandInput, setCommandInput] = useState("");

  // Command history (local, fed by WS acks)
  interface CommandEntry {
    id: string;
    action: string;
    status: "sent" | "acknowledged" | "failed";
    timestamp: Date;
    result?: Record<string, unknown>;
    error?: string;
  }
  const [commandHistory, setCommandHistory] = useState<CommandEntry[]>([]);
  const commandCounterRef = useRef(0);

  // Track command_ack messages
  const prevAckRef = useRef(lastCommandAck);
  useEffect(() => {
    if (lastCommandAck && lastCommandAck !== prevAckRef.current) {
      prevAckRef.current = lastCommandAck;
      setCommandHistory((prev) => {
        // Try to update existing "sent" entry, otherwise add new
        const existing = prev.find(
          (c) => c.status === "sent" && c.action === lastCommandAck.action
        );
        if (existing) {
          return prev.map((c) =>
            c.id === existing.id
              ? {
                  ...c,
                  status: lastCommandAck.success ? "acknowledged" : "failed",
                  result: lastCommandAck.result,
                  error: lastCommandAck.error,
                }
              : c
          );
        }
        // No matching sent entry - add as new
        const status: CommandEntry["status"] = lastCommandAck.success ? "acknowledged" : "failed";
        return [
          {
            id: lastCommandAck.commandId,
            action: lastCommandAck.action,
            status,
            timestamp: new Date(),
            result: lastCommandAck.result,
            error: lastCommandAck.error,
          },
          ...prev,
        ].slice(0, 10);
      });
    }
  }, [lastCommandAck]);

  // Wrap sendCommand to also add "sent" entries
  const sendCommandWithHistory = useCallback(
    (action: string, params?: Record<string, unknown>) => {
      commandCounterRef.current += 1;
      setCommandHistory((prev) =>
        [
          {
            id: `local-${commandCounterRef.current}`,
            action,
            status: "sent" as const,
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 10)
      );
      sendCommand(action, params);
    },
    [sendCommand]
  );

  // Accumulate WS telemetry into local history
  const [wsTelemetryHistory, setWsTelemetryHistory] = useState<IotTelemetry[]>([]);
  const prevTelemetryRef = useRef(wsTelemetry);
  useEffect(() => {
    if (wsTelemetry && wsTelemetry !== prevTelemetryRef.current) {
      prevTelemetryRef.current = wsTelemetry;
      setWsTelemetryHistory((prev) =>
        [
          {
            id: `ws-${Date.now()}`,
            deviceId: device.deviceId,
            timestamp: new Date().toISOString(),
            freeHeap: wsTelemetry.freeHeap,
            wifiRssi: wsTelemetry.wifiRssi,
            uptimeSecs: wsTelemetry.uptimeSecs,
            sensors: null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 20)
      );
    }
  }, [wsTelemetry, device.deviceId]);

  // Merged telemetry: WS entries (newest) + REST entries (older)
  const mergedTelemetry = [...wsTelemetryHistory, ...telemetry].slice(0, 20);

  // Use WS online status (real-time) instead of REST status
  const isOnline = isConnected ? isDeviceOnline : device.status === "online";

  // Use WS telemetry if available, fallback to REST telemetry
  const latestTelemetry = wsTelemetry || telemetry[0];

  const handleSendCommand = () => {
    if (!commandInput.trim()) return;

    // Try to parse as JSON for payload
    let command = commandInput;
    let params: Record<string, unknown> | undefined;

    try {
      const parsed = JSON.parse(commandInput);
      if (parsed.command) {
        command = parsed.command;
        params = parsed.payload;
      }
    } catch {
      // Not JSON, use as plain command
    }

    sendCommandWithHistory(command, params);
    setCommandInput("");
  };

  // Quick commands (must match ESP32 firmware command names)
  const quickCommands = [
    { label: "Reiniciar", command: "restart" },
    { label: "Estado", command: "get_status" },
    { label: "LED On", command: "led_on" },
    { label: "LED Off", command: "led_off" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/iot">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{device.name}</h1>
              <Badge
                className={
                  isOnline
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                }
              >
                {isOnline ? (
                  <Wifi className="w-3 h-3 mr-1" />
                ) : (
                  <WifiOff className="w-3 h-3 mr-1" />
                )}
                {isOnline ? "online" : "offline"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm font-mono">
              {device.deviceId}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Readings - Uses WS telemetry when available */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Telemetria en Tiempo Real
              </CardTitle>
              <CardDescription>
                {wsTelemetry ? (
                  "Actualizado via WebSocket"
                ) : latestTelemetry ? (
                  <>
                    Ultima actualizacion:{" "}
                    {formatDistanceToNow(new Date(latestTelemetry.timestamp), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </>
                ) : (
                  "Sin datos de telemetria"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestTelemetry ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Sensors from REST telemetry (if no WS telemetry) */}
                  {!wsTelemetry && telemetry[0]?.sensors && Object.entries(
                    telemetry[0].sensors as Record<string, number | string | boolean>
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-4 rounded-lg bg-muted/50 space-y-2"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getSensorIcon(key)}
                        <span className="text-xs uppercase">{key}</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatSensorValue(key, value)}
                      </p>
                    </div>
                  ))}

                  {/* Free Heap */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs uppercase">Memoria</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.round(latestTelemetry.freeHeap / 1024)} KB
                    </p>
                  </div>

                  {/* RSSI */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Signal className="w-4 h-4" />
                      <span className="text-xs uppercase">WiFi</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {latestTelemetry.wifiRssi} dBm
                    </p>
                  </div>

                  {/* Uptime */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs uppercase">Uptime</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.floor(latestTelemetry.uptimeSecs / 60)}m
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay datos de telemetria disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Telemetry History (from initial REST fetch) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Historial de Telemetria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mergedTelemetry.length > 0 ? (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs text-muted-foreground uppercase tracking-wide border-b">
                    <span>Fecha</span>
                    <span>Fuente</span>
                    <span className="text-right">Memoria</span>
                    <span className="text-right">Señal</span>
                    <span className="text-right">Uptime</span>
                  </div>
                  {/* Data rows */}
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                  {mergedTelemetry.map((t) => {
                    const isWs = t.id.startsWith("ws-");
                    return (
                      <div
                        key={t.id}
                        className={`grid grid-cols-5 gap-2 p-3 rounded-lg text-sm items-center ${isWs ? "bg-green-500/5 border border-green-500/10" : "bg-muted/30"}`}
                      >
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(t.timestamp), "HH:mm:ss dd/MM", {
                            locale: es,
                          })}
                        </span>
                        <span className="text-xs">
                          {isWs ? (
                            <Badge variant="outline" className="text-green-500 text-[10px] px-1 py-0">WS</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] px-1 py-0">REST</Badge>
                          )}
                        </span>
                        <span className="text-xs font-mono text-right">{Math.round(t.freeHeap / 1024)}KB</span>
                        <span className="text-xs font-mono text-right">{t.wifiRssi}dBm</span>
                        <span className="text-xs font-mono text-right">{Math.floor(t.uptimeSecs / 60)}m</span>
                      </div>
                    );
                  })}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Sin historial
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Light Control - Uses shared WS context */}
          <LightControl deviceId={device.deviceId} />

          {/* Device Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <p className="capitalize">{device.type}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Firmware</Label>
                <p>{device.firmwareVersion || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Registrado
                </Label>
                <p>
                  {format(new Date(device.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })}
                </p>
              </div>
              {device.lastSeen && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Ultima Conexion
                  </Label>
                  <p>
                    {formatDistanceToNow(new Date(device.lastSeen), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              )}
              {/* Chip Info from metadata */}
              {device.metadata?.chipInfo != null && (() => {
                const chipInfo = device.metadata.chipInfo as ChipInfo;
                return (
                  <>
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">Chip</Label>
                      <p className="font-mono text-sm">{chipInfo.model ?? "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Cores</Label>
                      <p>{chipInfo.cores != null ? chipInfo.cores : "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">ESP-IDF</Label>
                      <p className="font-mono text-xs">{chipInfo.idf_version ?? "N/A"}</p>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Commands - Now via WebSocket */}
          <Card>
            <CardHeader>
              <CardTitle>Comandos</CardTitle>
              <CardDescription>Envia comandos al dispositivo via WebSocket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Commands */}
              <div className="flex flex-wrap gap-2">
                {quickCommands.map((qc) => (
                  <Button
                    key={qc.command}
                    variant="outline"
                    size="sm"
                    onClick={() => sendCommandWithHistory(qc.command)}
                    disabled={!isConnected || !isDeviceOnline}
                  >
                    {qc.label}
                  </Button>
                ))}
              </div>

              {/* Custom Command */}
              <div className="flex gap-2">
                <Input
                  placeholder="Comando personalizado..."
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCommand()}
                />
                <Button
                  size="icon"
                  onClick={handleSendCommand}
                  disabled={!isConnected || !isDeviceOnline || !commandInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Recent Commands */}
              {commandHistory.length > 0 && (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-muted-foreground">
                    Comandos Recientes
                  </Label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {commandHistory.slice(0, 5).map((cmd) => (
                      <div
                        key={cmd.id}
                        className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                      >
                        <span className="font-mono">{cmd.action}</span>
                        <Badge
                          variant="outline"
                          className={
                            cmd.status === "acknowledged"
                              ? "text-green-500"
                              : cmd.status === "failed"
                              ? "text-red-500"
                              : "text-yellow-500"
                          }
                        >
                          {cmd.status === "sent" ? "enviado" : cmd.status === "acknowledged" ? "ok" : "error"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
