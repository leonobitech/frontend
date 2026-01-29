"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { Sun, Moon, Thermometer, Plug, Unplug, Zap, Settings2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDeviceWebSocket } from "@/hooks/useDeviceWebSocket";
import { useOptionalDeviceWs } from "@/app/iot/[deviceId]/DeviceWsContext";
import { useOptionalScheduleSync } from "@/app/iot/[deviceId]/ScheduleSyncContext";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface LightControlProps {
  deviceId: string;
  className?: string;
}

// =============================================================================
// Utility Functions
// =============================================================================

// Convert temperature (0-100) to color representation
// 0 = warm (2700K orange), 100 = cool (6500K blue-white)
function temperatureToColor(temperature: number, intensity: number = 100): string {
  const t = temperature / 100;
  const i = Math.max(0.3, intensity / 100); // Min brightness for visibility

  // Warm color (2700K) - orange/amber
  const warmR = 255;
  const warmG = 180;
  const warmB = 100;

  // Cool color (6500K) - blue-white
  const coolR = 200;
  const coolG = 220;
  const coolB = 255;

  const r = Math.round((warmR * (1 - t) + coolR * t) * i);
  const g = Math.round((warmG * (1 - t) + coolG * t) * i);
  const b = Math.round((warmB * (1 - t) + coolB * t) * i);

  return `rgb(${r}, ${g}, ${b})`;
}

// Get temperature label
function getTemperatureLabel(temperature: number): string {
  if (temperature <= 20) return "Muy Calido";
  if (temperature <= 40) return "Calido";
  if (temperature <= 60) return "Neutro";
  if (temperature <= 80) return "Frio";
  return "Muy Frio";
}

// =============================================================================
// Component
// =============================================================================

export function LightControl({ deviceId, className }: LightControlProps) {
  // Use shared context if available (inside DeviceWsProvider), otherwise own hook
  const sharedWs = useOptionalDeviceWs();
  const ownWs = useDeviceWebSocket({ deviceId, autoConnect: !sharedWs });
  const ws = sharedWs || ownWs;

  const {
    connectionState,
    isConnected,
    isDeviceOnline,
    lightState,
    setLight,
    setMode,
    requestState,
  } = ws;

  const scheduleSync = useOptionalScheduleSync();
  const isAutoMode = lightState.mode === "auto";

  // Local state for smooth slider interaction
  const [localIntensity, setLocalIntensity] = useState(lightState.intensity);
  const [localTemperature, setLocalTemperature] = useState(lightState.temperature);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Debounce timer
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state with server state when not adjusting
  useEffect(() => {
    if (!isAdjusting) {
      setLocalIntensity(lightState.intensity);
      setLocalTemperature(lightState.temperature);
    }
  }, [lightState.intensity, lightState.temperature, isAdjusting]);

  // Send update with debounce
  const sendUpdate = useCallback(
    (intensity: number, temperature: number) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setLight(intensity, temperature);
        setIsAdjusting(false);
      }, 100);
    },
    [setLight]
  );

  // Handle intensity change
  const handleIntensityChange = useCallback(
    (value: number[]) => {
      const newValue = value[0];
      setIsAdjusting(true);
      setLocalIntensity(newValue);
      sendUpdate(newValue, localTemperature);
    },
    [localTemperature, sendUpdate]
  );

  // Handle temperature change
  const handleTemperatureChange = useCallback(
    (value: number[]) => {
      const newValue = value[0];
      setIsAdjusting(true);
      setLocalTemperature(newValue);
      sendUpdate(localIntensity, newValue);
    },
    [localIntensity, sendUpdate]
  );

  // Handle mode toggle
  const handleModeToggle = useCallback(
    (checked: boolean) => {
      const mode = checked ? "auto" : "manual";
      setMode(mode);
      // Request fresh state so sliders reflect interpolated values
      if (mode === "auto") {
        setTimeout(() => requestState(), 300);
      }
    },
    [setMode, requestState]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Preview color based on current local values
  const previewColor = temperatureToColor(localTemperature, localIntensity);

  // Connection status badge
  const ConnectionBadge = () => {
    if (!isConnected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
          <Unplug className="w-3.5 h-3.5" />
          {connectionState === "connecting" || connectionState === "reconnecting"
            ? "Conectando..."
            : "Desconectado"}
        </span>
      );
    }

    if (!isDeviceOnline) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-orange-500/10 text-orange-500 border-orange-500/30">
          <Unplug className="w-3.5 h-3.5" />
          Offline
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-green-500/10 text-green-500 border-green-500/30">
        <Plug className="w-3.5 h-3.5" />
        Conectado
      </span>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5" />
              Control de Luz
            </CardTitle>
            <CardDescription>Control en tiempo real via WebSocket</CardDescription>
          </div>
          <ConnectionBadge />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Light Preview */}
        <div className="flex justify-center">
          <div
            className="w-18 h-18 rounded-full transition-all duration-200 flex items-center justify-center"
            style={{
              backgroundColor: localIntensity > 0 ? previewColor : "rgb(30, 30, 30)",
              boxShadow:
                localIntensity > 0
                  ? `0 0 ${20 + localIntensity / 2}px ${previewColor}, 0 0 ${40 + localIntensity}px ${previewColor}`
                  : "none",
            }}
          >
            {localIntensity > 0 ? (
              <Sun
                className="w-7 h-7"
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
              />
            ) : (
              <Moon className="w-7 h-7 text-gray-600" />
            )}
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4" />
              Intensidad
            </Label>
            <span className="text-sm font-mono tabular-nums text-muted-foreground">
              {localIntensity}%
            </span>
          </div>
          <Slider
            value={[localIntensity]}
            onValueChange={handleIntensityChange}
            max={100}
            step={1}
            disabled={!isConnected || !isDeviceOnline || isAutoMode}
            active={localIntensity > 0}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Apagado</span>
            <span>Maximo</span>
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Thermometer className="w-4 h-4" />
              Temperatura de Color
            </Label>
            <span className="text-sm text-muted-foreground">
              {getTemperatureLabel(localTemperature)}
            </span>
          </div>
          <div className="relative">
            {/* Temperature gradient background */}
            <div
              className="absolute inset-0 rounded-full h-1.5 top-1/2 -translate-y-1/2 opacity-30"
              style={{
                background:
                  "linear-gradient(to right, rgb(255, 180, 100), rgb(255, 220, 180), rgb(255, 255, 255), rgb(200, 220, 255))",
              }}
            />
            <Slider
              value={[localTemperature]}
              onValueChange={handleTemperatureChange}
              max={100}
              step={1}
              disabled={!isConnected || !isDeviceOnline || isAutoMode}
              active={localIntensity > 0}
              className="relative"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-orange-400">2700K Calido</span>
            <span className="text-blue-300">6500K Frio</span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Modo Automatico</Label>
              <p className="text-xs text-muted-foreground">
                {isAutoMode && scheduleSync?.syncedPreset
                  ? `Preset: ${scheduleSync.syncedPreset}`
                  : isAutoMode
                    ? "Sigue el horario programado"
                    : !scheduleSync?.syncedPreset
                      ? "Sincroniza un preset para activar."
                      : "En modo manual. El horario programado no se aplicara."}
              </p>
            </div>
          </div>
          <Switch
            checked={isAutoMode}
            onCheckedChange={handleModeToggle}
            disabled={!isConnected || !isDeviceOnline || (!scheduleSync?.syncedPreset && !isAutoMode)}
          />
        </div>

        {/* Auto Mode Warning */}
        {isAutoMode && (
          <p className="text-xs text-center text-amber-500">
            Modo automatico activo. Controles manuales deshabilitados.
          </p>
        )}

      </CardContent>
    </Card>
  );
}
