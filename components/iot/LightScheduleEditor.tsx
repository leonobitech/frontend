"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Plus, RotateCcw, Send, Sunrise, Sun, Moon, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useDeviceWebSocket, type SchedulePoint } from "@/hooks/useDeviceWebSocket";
import { useOptionalDeviceWs } from "@/app/iot/[deviceId]/DeviceWsContext";
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

  const { isConnected, isDeviceOnline, syncSchedule } = ws;

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
    toast.success(`Horario sincronizado (${sorted.length} puntos)`);
  }, [points, syncSchedule]);

  const disabled = !isConnected || !isDeviceOnline;

  return (
    <Card className={cn("overflow-hidden flex flex-col", className)}>
      {/* Fixed Header */}
      <CardHeader className="pb-2 px-4 pt-4 shrink-0 space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-3.5 h-3.5" />
            Programar Horario
          </CardTitle>
          {points.length > 0 && (
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
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
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
        {/* Presets - shown when no points */}
        {points.length === 0 && (
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
                  disabled={disabled}
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

        {/* Schedule Points */}
        {points.map((point, index) => (
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
                  disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-[10px] text-blue-300 w-8 text-right">Frio</span>
            </div>
          </div>
        ))}
      </CardContent>

      {/* Fixed Footer Buttons */}
      <div className="shrink-0 px-4 pb-4 pt-2 space-y-2">
        {points.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addPoint}
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Sincronizar Horario
          </Button>
        )}
      </div>
    </Card>
  );
}
