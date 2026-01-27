"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  RefreshCw,
  Send,
  Thermometer,
  Droplets,
  Gauge,
  Clock,
  Loader2,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

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

import type { IotDevice, IotTelemetry, IotCommand } from "@/types/iot";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

interface DeviceDetailResponse {
  device: IotDevice;
  telemetry: IotTelemetry[];
}

interface CommandsResponse {
  commands: IotCommand[];
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

async function fetchCommands(deviceId: string): Promise<CommandsResponse> {
  const screenResolution = typeof window !== "undefined"
    ? `${window.screen.width}x${window.screen.height}`
    : "unknown";
  const meta = buildClientMetaWithResolution(screenResolution, { label: "iot-commands" });

  const res = await fetch(`/api/iot/devices/${deviceId}/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "list", meta }),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch commands");
  }
  return res.json();
}

async function sendCommand(
  deviceId: string,
  command: string,
  payload?: Record<string, unknown>
) {
  const screenResolution = typeof window !== "undefined"
    ? `${window.screen.width}x${window.screen.height}`
    : "unknown";
  const meta = buildClientMetaWithResolution(screenResolution, { label: "iot-send-command" });

  const res = await fetch(`/api/iot/devices/${deviceId}/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "send", command, payload, meta }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to send command");
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
  const queryClient = useQueryClient();
  const [commandInput, setCommandInput] = useState("");

  // Fetch device and telemetry
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["iot-device", deviceId],
    queryFn: () => fetchDeviceDetail(deviceId),
    enabled: !!user && !!deviceId,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 3000,
  });

  // Fetch commands
  const { data: commandsData } = useQuery({
    queryKey: ["iot-commands", deviceId],
    queryFn: () => fetchCommands(deviceId),
    enabled: !!user && !!deviceId,
    refetchInterval: 10000,
  });

  // Send command mutation
  const sendMutation = useMutation({
    mutationFn: ({ cmd, payload }: { cmd: string; payload?: Record<string, unknown> }) =>
      sendCommand(deviceId, cmd, payload),
    onSuccess: () => {
      toast.success("Comando enviado");
      setCommandInput("");
      queryClient.invalidateQueries({ queryKey: ["iot-commands", deviceId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSendCommand = () => {
    if (!commandInput.trim()) return;

    // Try to parse as JSON for payload
    let command = commandInput;
    let payload: Record<string, unknown> | undefined;

    try {
      const parsed = JSON.parse(commandInput);
      if (parsed.command) {
        command = parsed.command;
        payload = parsed.payload;
      }
    } catch {
      // Not JSON, use as plain command
    }

    sendMutation.mutate({ cmd: command, payload });
  };

  // Quick commands
  const quickCommands = [
    { label: "Reiniciar", command: "reboot" },
    { label: "Estado", command: "status" },
    { label: "LED On", command: "led", payload: { state: true } },
    { label: "LED Off", command: "led", payload: { state: false } },
  ];

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

  const { device, telemetry } = data;
  const latestTelemetry = telemetry[0];
  const isOnline = device.status === "online";
  const commands = commandsData?.commands || [];

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
                {device.status}
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
          {/* Current Readings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Telemetria en Tiempo Real
              </CardTitle>
              <CardDescription>
                {latestTelemetry ? (
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
              {latestTelemetry?.sensors ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(
                    latestTelemetry.sensors as Record<string, number | string | boolean>
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

                  {/* Battery */}
                  {latestTelemetry.battery !== null && (
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Battery className="w-4 h-4" />
                        <span className="text-xs uppercase">Bateria</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {latestTelemetry.battery}%
                      </p>
                    </div>
                  )}

                  {/* RSSI */}
                  {latestTelemetry.rssi !== null && (
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Signal className="w-4 h-4" />
                        <span className="text-xs uppercase">RSSI</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {latestTelemetry.rssi} dBm
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay datos de telemetria disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Telemetry History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Historial de Telemetria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {telemetry.slice(0, 20).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {format(new Date(t.timestamp), "HH:mm:ss dd/MM", {
                          locale: es,
                        })}
                      </span>
                      <div className="flex items-center gap-4">
                        {Object.entries(
                          (t.sensors as Record<string, number | string | boolean>) || {}
                        )
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <span key={key} className="font-mono">
                              {key}: {formatSensorValue(key, value)}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
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
            </CardContent>
          </Card>

          {/* Commands */}
          <Card>
            <CardHeader>
              <CardTitle>Comandos</CardTitle>
              <CardDescription>Envia comandos al dispositivo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Commands */}
              <div className="flex flex-wrap gap-2">
                {quickCommands.map((qc) => (
                  <Button
                    key={qc.command}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      sendMutation.mutate({ cmd: qc.command, payload: qc.payload })
                    }
                    disabled={sendMutation.isPending}
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
                  disabled={sendMutation.isPending || !commandInput.trim()}
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Recent Commands */}
              {commands.length > 0 && (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-muted-foreground">
                    Comandos Recientes
                  </Label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {commands.slice(0, 5).map((cmd) => (
                      <div
                        key={cmd.id}
                        className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                      >
                        <span className="font-mono">{cmd.command}</span>
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
                          {cmd.status}
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
