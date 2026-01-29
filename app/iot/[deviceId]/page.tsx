"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Signal,
  RefreshCw,
  Send,
  Thermometer,
  Droplets,
  Gauge,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Terminal,
} from "lucide-react";

import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { LightScheduleEditor } from "@/components/iot/LightScheduleEditor";
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
  const { isDeviceOnline, isConnected, telemetry: wsTelemetry, lastCommandAck, sendCommand, lightState, setLight } = useDeviceWs();
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
            localTime: wsTelemetry.localTime,
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

  // Remember last non-zero intensity so LED On restores it after LED Off
  const lastIntensityRef = useRef(lightState.intensity || 100);
  useEffect(() => {
    if (lightState.intensity > 0) {
      lastIntensityRef.current = lightState.intensity;
    }
  }, [lightState.intensity]);

  // LED on/off using current slider values via set_light (not hardcoded commands)
  const handleLedOn = () => {
    const intensity = lastIntensityRef.current;
    setLight(intensity, lightState.temperature);
    // Also log to command history for visibility
    commandCounterRef.current += 1;
    setCommandHistory((prev) =>
      [{ id: `local-${commandCounterRef.current}`, action: `led_on (${intensity}%)`, status: "acknowledged" as const, timestamp: new Date() }, ...prev].slice(0, 10)
    );
  };

  const handleLedOff = () => {
    setLight(0, lightState.temperature);
    commandCounterRef.current += 1;
    setCommandHistory((prev) =>
      [{ id: `local-${commandCounterRef.current}`, action: "led_off (0%)", status: "acknowledged" as const, timestamp: new Date() }, ...prev].slice(0, 10)
    );
  };

  // Quick commands (must match ESP32 firmware command names)
  const quickCommands = [
    { label: "Reiniciar", command: "restart" },
    { label: "Estado", command: "get_status" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
      {/* HUD Header */}
      <div className="rounded-lg border border-muted-foreground/10 bg-muted/20 p-3">
        {/* Row 1: Back + Name + Status + Refresh */}
        <div className="flex items-center gap-3">
          <Link href="/iot">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{device.name}</h1>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${isOnline ? "bg-green-500/10 text-green-500 border-green-500/30" : "bg-gray-500/10 text-gray-500 border-gray-500/30"}`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? "Online" : "Offline"}
          </span>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`w-3 h-3 mr-1 ${isFetching ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Row 2: HUD metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 mt-3 border-t border-muted-foreground/10 pl-10">
          {/* Section: DISPOSITIVO */}
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium">Dispositivo</span>
            <p className="text-[11px] font-mono text-muted-foreground truncate">ID: {device.deviceId}</p>
            <p className="text-[11px] capitalize">{device.type}</p>
            <p className="text-[11px] text-muted-foreground">
              Reg: {format(new Date(device.createdAt), "dd/MM/yy", { locale: es })}
            </p>
          </div>

          {/* Section: HARDWARE */}
          <div className="space-y-0.5 border-l border-muted-foreground/10 pl-3">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium">Hardware</span>
            {(() => {
              const chip = device.metadata?.chipInfo as ChipInfo | undefined;
              return (
                <>
                  <p className="text-[11px] font-mono">
                    {chip?.model || "—"}{chip?.cores != null ? ` · ${chip.cores} cores` : ""}
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    {device.firmwareVersion ? `FW ${device.firmwareVersion}` : "—"}
                    {chip?.idf_version ? ` · IDF ${chip.idf_version}` : ""}
                  </p>
                </>
              );
            })()}
          </div>

          {/* Section: RED */}
          <div className="space-y-0.5 md:border-l border-muted-foreground/10 md:pl-3">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium">Red</span>
            {(() => {
              // Prefer real-time WS data, fallback to DB telemetry sensors
              const wssSsid = wsTelemetry?.wifiSsid;
              const wsIp = wsTelemetry?.ipAddress;
              const networkEntry = telemetry.find((t) => {
                const s = t.sensors as Record<string, unknown> | null;
                return s?.wifiSsid || s?.ipAddress;
              });
              const sensors = networkEntry?.sensors as Record<string, number | string | boolean> | null;
              const ssid = wssSsid || (sensors?.wifiSsid ? String(sensors.wifiSsid) : null);
              const ip = wsIp || (sensors?.ipAddress ? String(sensors.ipAddress) : null);
              return (
                <>
                  <p className="text-[11px]">{ssid || "—"}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{ip || "—"}</p>
                </>
              );
            })()}
          </div>

          {/* Section: ACTIVIDAD */}
          <div className="space-y-0.5 border-l border-muted-foreground/10 pl-3">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium">Actividad</span>
            <p className="text-[11px] text-muted-foreground">
              Visto: {device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: false, locale: es }) : "—"}
            </p>
            {wsTelemetry?.localTime && (
              <p className="text-[11px] font-mono text-muted-foreground">
                <Clock className="w-2.5 h-2.5 inline mr-1 opacity-50" />
                Hora local: {wsTelemetry.localTime.split(" ")[1]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-18rem)] lg:items-stretch items-start">
        {/* Column 1: Light Control */}
        <div className="min-h-0 flex flex-col">
          <LightControl deviceId={device.deviceId} />
        </div>

        {/* Column 2: Light Schedule */}
        <div className="min-h-0 flex flex-col">
          <LightScheduleEditor deviceId={device.deviceId} />
        </div>

        {/* Column 3: Telemetry */}
        <div className="flex flex-col gap-6 min-h-0">
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
                  ).filter(([key]) => key !== "ipAddress" && key !== "wifiSsid").map(([key, value]) => (
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
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Historial de Telemetria
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {mergedTelemetry.length > 0 ? (
                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                  {/* Header */}
                  <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs text-muted-foreground uppercase tracking-wide border-b">
                    <span>Fecha</span>
                    <span>Fuente</span>
                    <span className="text-right">Memoria</span>
                    <span className="text-right">Señal</span>
                    <span className="text-right">Uptime</span>
                  </div>
                  {/* Data rows */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                  {mergedTelemetry.map((t, index) => {
                    const isLive = t.id.startsWith("ws-") && index === 0;
                    return (
                      <div
                        key={t.id}
                        className={`grid grid-cols-5 gap-2 p-3 rounded-lg text-sm items-center ${isLive ? "bg-green-500/5 border border-green-500/10" : "bg-muted/30"}`}
                      >
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(t.timestamp), "HH:mm:ss dd/MM", {
                            locale: es,
                          })}
                        </span>
                        <span className="text-xs">
                          {isLive ? (
                            <Badge variant="outline" className="text-green-500 text-[10px] px-1 py-0">WS</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] px-1 py-0">DB</Badge>
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

      </div>

      {/* Terminal-style Commands Bar */}
      <div className="rounded-lg border bg-black/40 backdrop-blur-sm p-4 font-mono">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-sm text-muted-foreground">
            <Terminal className="w-4 h-4 inline mr-1.5" />
            Comandos — {device.deviceId}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {quickCommands.map((qc) => (
            <Button
              key={qc.command}
              variant="outline"
              size="sm"
              className="font-mono text-xs"
              onClick={() => sendCommandWithHistory(qc.command)}
              disabled={!isConnected || !isDeviceOnline}
            >
              {qc.label}
            </Button>
          ))}
          <Button
            variant={lightState.intensity > 0 ? "default" : "outline"}
            size="sm"
            className="font-mono text-xs"
            onClick={lightState.intensity > 0 ? handleLedOff : handleLedOn}
            disabled={!isConnected || !isDeviceOnline}
          >
            LED {lightState.intensity > 0 ? "Off" : "On"}
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-green-500 text-sm">$</span>
          <Input
            placeholder="comando..."
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendCommand()}
            className="font-mono text-sm bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-8"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSendCommand}
            disabled={!isConnected || !isDeviceOnline || !commandInput.trim()}
            className="h-8 w-8"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-1 max-h-32 overflow-y-auto">
            {commandHistory.slice(0, 7).map((cmd) => (
              <div key={cmd.id} className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">$</span>
                <span className="text-green-400/80">{cmd.action}</span>
                <Badge
                  variant="outline"
                  className={`ml-auto ${
                    cmd.status === "acknowledged"
                      ? "text-green-500"
                      : cmd.status === "failed"
                      ? "text-red-500"
                      : "text-yellow-500"
                  }`}
                >
                  {cmd.status === "sent" ? "enviado" : cmd.status === "acknowledged" ? "ok" : "error"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
