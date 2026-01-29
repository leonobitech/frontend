"use client";

import { useCallback, useState } from "react";
import { Clock, Plus, Send, Trash2 } from "lucide-react";

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

  const [points, setPoints] = useState<SchedulePoint[]>([]);

  const addPoint = useCallback(() => {
    setPoints((prev) => [
      ...prev,
      { hour: 12, minute: 0, intensity: 50, temperature: 50 },
    ]);
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
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Horario de Luz
          </CardTitle>
          {points.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {points.length} {points.length === 1 ? "punto" : "puntos"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Schedule Points */}
        {points.map((point, index) => (
          <div
            key={index}
            className="p-3 rounded-lg bg-muted/30 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <Input
                type="time"
                value={`${String(point.hour).padStart(2, "0")}:${String(point.minute).padStart(2, "0")}`}
                onChange={(e) => updateTime(index, e.target.value)}
                className="w-28 text-sm font-mono"
                disabled={disabled}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removePoint(index)}
                disabled={disabled}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Intensity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Intensidad</span>
                <span className="font-mono">{point.intensity}%</span>
              </div>
              <Slider
                value={[point.intensity]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => updatePoint(index, "intensity", v[0])}
                disabled={disabled}
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-orange-400">Calido</span>
                <span className="font-mono">{point.temperature}</span>
                <span className="text-blue-300">Frio</span>
              </div>
              <Slider
                value={[point.temperature]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => updatePoint(index, "temperature", v[0])}
                disabled={disabled}
              />
            </div>
          </div>
        ))}

        {/* Empty State */}
        {points.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-4">
            Sin puntos de horario. Agrega puntos para programar la luz.
          </p>
        )}

        {/* Add Point Button */}
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

        {/* Sync Button */}
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
      </CardContent>
    </Card>
  );
}
