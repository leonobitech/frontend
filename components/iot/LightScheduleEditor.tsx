"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Plus, Undo2, Send, Sunrise, Sun, Moon, Trash2, PowerOff, CalendarCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useDeviceWebSocket, type SchedulePoint } from "@/hooks/useDeviceWebSocket";
import { useOptionalDeviceWs } from "@/app/iot/[deviceId]/DeviceWsContext";
import { useOptionalScheduleSync } from "@/app/iot/[deviceId]/ScheduleSyncContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// Constants
// =============================================================================

const PRESETS: { label: string; icon: typeof Sun; points: SchedulePoint[] }[] = [
  {
    label: "Ciclo Natural",
    icon: Sunrise,
    points: [
      { hour: 6, minute: 0, intensity: 30, temperature: 20 },
      { hour: 12, minute: 0, intensity: 100, temperature: 50 },
      { hour: 18, minute: 0, intensity: 60, temperature: 30 },
      { hour: 22, minute: 0, intensity: 5, temperature: 10 },
    ],
  },
  {
    label: "Oficina",
    icon: Sun,
    points: [
      { hour: 8, minute: 0, intensity: 80, temperature: 70 },
      { hour: 13, minute: 0, intensity: 90, temperature: 60 },
      { hour: 19, minute: 0, intensity: 40, temperature: 30 },
      { hour: 23, minute: 0, intensity: 0, temperature: 0 },
    ],
  },
  {
    label: "Relajacion",
    icon: Moon,
    points: [
      { hour: 7, minute: 0, intensity: 40, temperature: 20 },
      { hour: 14, minute: 0, intensity: 60, temperature: 40 },
      { hour: 19, minute: 0, intensity: 30, temperature: 15 },
      { hour: 22, minute: 0, intensity: 10, temperature: 5 },
    ],
  },
];

// =============================================================================
// Types
// =============================================================================

interface LightScheduleEditorProps {
  deviceId: string;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function LightScheduleEditor({ deviceId, className }: LightScheduleEditorProps) {
  const sharedWs = useOptionalDeviceWs();
  const ownWs = useDeviceWebSocket({ deviceId, autoConnect: !sharedWs });
  const ws = sharedWs || ownWs;

  const { isConnected, isDeviceOnline, syncSchedule, requestState, lightState } = ws;
  const scheduleSync = useOptionalScheduleSync();

  const storageKey = `schedule-${deviceId}`;

  const [points, setPoints] = useState<SchedulePoint[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved).points ?? [] : [];
    } catch { return []; }
  });

  const [presetName, setPresetName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved).presetName ?? null : null;
    } catch { return null; }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ points, presetName }));
  }, [points, presetName, storageKey]);

  // Seed syncedPreset from localStorage if it was set before the context existed
  useEffect(() => {
    if (scheduleSync && !scheduleSync.syncedPreset && presetName) {
      scheduleSync.setSyncedPreset(presetName);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPoint = useCallback(() => {
    setPoints((prev) => [
      ...prev,
      { hour: 12, minute: 0, intensity: 50, temperature: 50 },
    ]);
  }, []);

  const loadPreset = useCallback((label: string, presetPoints: SchedulePoint[]) => {
    setPoints([...presetPoints]);
    setPresetName(label);
    toast.success("Preset cargado. Ajusta los valores y sincroniza.");
  }, []);

  const removePoint = useCallback((index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePoint = useCallback(
    (index: number, field: keyof SchedulePoint, value: number) => {
      setPoints((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  const updateTime = useCallback(
    (index: number, timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        setPoints((prev) =>
          prev.map((p, i) =>
            i === index ? { ...p, hour: hours, minute: minutes } : p
          )
        );
      }
    },
    []
  );

  const handleSync = useCallback(() => {
    if (points.length === 0) {
      toast.error("Agrega al menos un punto al horario");
      return;
    }

    const sorted = [...points].sort(
      (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
    );

    syncSchedule(sorted);
    scheduleSync?.setSyncedPreset(presetName);
    toast.success(`Horario sincronizado (${sorted.length} puntos)`);

    // If already in auto mode, request fresh state with new schedule
    if (lightState.mode === "auto") {
      setTimeout(() => requestState(), 300);
    }
  }, [points, presetName, syncSchedule, scheduleSync, lightState.mode, requestState]);

  const handleDeactivate = useCallback(() => {
    syncSchedule([]);
    scheduleSync?.clearSyncedPreset();
    setPoints([]);
    setPresetName(null);
    toast.info("Preset desactivado. Horario limpiado del ESP32.");
  }, [syncSchedule, scheduleSync]);

  const disabled = !isConnected || !isDeviceOnline;
  const isSynced = !!scheduleSync?.syncedPreset;
  const isAutoMode = lightState.mode === "auto";

  return (
    <Card className={cn("overflow-hidden flex flex-col", className)}>
      {/* Fixed Header */}
      <CardHeader className="pb-2 px-4 pt-4 shrink-0 space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-3.5 h-3.5" />
            Horario Programado
          </CardTitle>
          {points.length > 0 && !isSynced && (
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {points.length} {points.length === 1 ? "punto" : "puntos"}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => { setPoints([]); setPresetName(null); toast.info("Horario limpiado"); }}
              >
                <Undo2 className="w-3 h-3" />
              </Button>
            </div>
          )}
          {isSynced && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-blue-500/10 text-blue-500 border-blue-500/30">
              <CalendarCheck className="w-3.5 h-3.5" />
              Sincronizado
            </span>
          )}
        </div>
        {presetName && (
          <p className="text-xs text-muted-foreground">
            Preset: <span className="font-medium text-foreground">{presetName}</span>
          </p>
        )}
      </CardHeader>

      {/* Scrollable Content */}
      <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-2 px-4 pb-2">
        {/* Synced state - show summary only */}
        {isSynced && (
          <div className="space-y-4 py-3">
            <p className="text-sm text-muted-foreground text-center">
              Horario activo en el ESP32. Desactiva para editar o cambiar preset.
            </p>
            <div className="grid gap-2.5">
              {points.map((point, index) => (
                <div key={index} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-muted/20 text-sm text-muted-foreground">
                  <span className="font-mono font-medium text-foreground">
                    {String(point.hour).padStart(2, "0")}:{String(point.minute).padStart(2, "0")}
                  </span>
                  <span>Intensidad {point.intensity}%</span>
                  <span>Temp {point.temperature}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Presets - shown when no points and not synced */}
        {points.length === 0 && !isSynced && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Elige un preset o agrega puntos manualmente:
            </p>
            <div className="grid gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                  onClick={() => loadPreset(preset.label, preset.points)}
                  disabled={disabled || isAutoMode}
                >
                  <preset.icon className="w-3.5 h-3.5" />
                  {preset.label}
                  <span className="ml-auto text-muted-foreground">
                    {preset.points.length} puntos
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Points - editable only when not synced */}
        {!isSynced && points.map((point, index) => (
          <div
            key={index}
            className="p-2 rounded-md bg-muted/30 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Input
                  type="time"
                  value={`${String(point.hour).padStart(2, "0")}:${String(point.minute).padStart(2, "0")}`}
                  onChange={(e) => updateTime(index, e.target.value)}
                  className="w-24 h-7 text-xs font-mono"
                  disabled={disabled || isAutoMode}
                />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {point.hour >= 12 ? "PM" : "AM"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removePoint(index)}
                disabled={disabled || isAutoMode}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {/* Intensity */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">Intensidad</span>
              <Slider
                value={[point.intensity]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => updatePoint(index, "intensity", v[0])}
                disabled={disabled || isAutoMode}
                className="flex-1"
              />
              <span className="text-[10px] font-mono w-8 text-right">{point.intensity}%</span>
            </div>

            {/* Temperature */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-orange-400 w-14 shrink-0">Calido</span>
              <Slider
                value={[point.temperature]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => updatePoint(index, "temperature", v[0])}
                disabled={disabled || isAutoMode}
                className="flex-1"
              />
              <span className="text-[10px] text-blue-300 w-8 text-right">Frio</span>
            </div>
          </div>
        ))}
      </CardContent>

      {/* Fixed Footer Buttons */}
      <div className="shrink-0 px-4 pb-4 pt-2 space-y-2">
        {isSynced ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleDeactivate}
            disabled={disabled || isAutoMode}
          >
            <PowerOff className="w-3.5 h-3.5 mr-1.5" />
            Desactivar Preset
          </Button>
        ) : (
          <>
            {points.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addPoint}
                disabled={disabled || isAutoMode}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Agregar Punto
              </Button>
            )}

            {points.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={addPoint}
                disabled={disabled || isAutoMode}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                O agregar punto manual
              </Button>
            )}

            {points.length > 0 && (
              <Button
                size="sm"
                className="w-full"
                onClick={handleSync}
                disabled={disabled || isAutoMode}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Sincronizar Horario
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
