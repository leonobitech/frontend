"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Cpu,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IotDevice } from "@/types/iot";

interface DeviceCardProps {
  device: IotDevice;
  onDelete?: (deviceId: string) => void;
}

export function DeviceCard({ device, onDelete }: DeviceCardProps) {
  const isOnline = device.status === "online";
  const isProvisioning = device.status === "provisioning";

  const getStatusBadge = () => {
    if (isOnline) {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <Wifi className="w-3 h-3 mr-1" />
          Online
        </Badge>
      );
    }
    if (isProvisioning) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Signal className="w-3 h-3 mr-1 animate-pulse" />
          Provisioning
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
        <WifiOff className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    );
  };

  const getDeviceIcon = () => {
    switch (device.type) {
      case "sensor":
        return <Signal className="w-5 h-5" />;
      case "actuator":
        return <Cpu className="w-5 h-5" />;
      default:
        return <Cpu className="w-5 h-5" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isOnline
                  ? "bg-green-500/10 text-green-500"
                  : "bg-gray-500/10 text-gray-500"
              }`}
            >
              {getDeviceIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{device.name}</CardTitle>
              <CardDescription className="text-xs font-mono">
                {device.deviceId}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(device.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          {getStatusBadge()}
          <span className="text-xs text-muted-foreground capitalize">
            {device.type}
          </span>
        </div>

        {device.firmwareVersion && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Battery className="w-3 h-3" />
            <span>Firmware: {device.firmwareVersion}</span>
          </div>
        )}

        {device.lastSeen && (
          <p className="text-xs text-muted-foreground">
            Ultima vez:{" "}
            {formatDistanceToNow(new Date(device.lastSeen), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        )}

        <Link href={`/iot/${device.id}`}>
          <Button variant="outline" className="w-full mt-2">
            Ver Detalles
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
