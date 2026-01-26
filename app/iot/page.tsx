"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Cpu, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { DeviceCard } from "./components/DeviceCard";
import type { IotDevice } from "@/types/iot";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";

type ClientMeta = ReturnType<typeof buildClientMetaWithResolution>;

async function fetchDevices(meta: ClientMeta): Promise<{ devices: IotDevice[] }> {
  const res = await fetch("/api/iot/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "list", meta }),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch devices");
  }
  return res.json();
}

async function deleteDevice(deviceId: string, meta: ClientMeta): Promise<void> {
  const res = await fetch(`/api/iot/devices/${deviceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "delete", meta }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to delete device");
  }
}

export default function IotDashboardPage() {
  const { user, loading: authLoading } = useSessionGuard();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [screenResolution, setScreenResolution] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setScreenResolution(`${window.screen.width}x${window.screen.height}`);
    }
  }, []);

  const getMeta = () => buildClientMetaWithResolution(screenResolution, { label: "leonobitech" });

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["iot-devices"],
    queryFn: () => fetchDevices(getMeta()),
    enabled: !!user && !!screenResolution,
    refetchInterval: 10000, // Poll every 10 seconds
    staleTime: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (deviceId: string) => deleteDevice(deviceId, getMeta()),
    onSuccess: () => {
      toast.success("Dispositivo eliminado");
      queryClient.invalidateQueries({ queryKey: ["iot-devices"] });
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar dispositivo");
    },
  });

  const handleDeleteClick = (deviceId: string) => {
    setDeviceToDelete(deviceId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deviceToDelete) {
      deleteMutation.mutate(deviceToDelete);
    }
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useSessionGuard will redirect
  }

  const devices = data?.devices || [];
  const onlineCount = devices.filter((d) => d.status === "online").length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IoT Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {devices.length} dispositivos &bull; {onlineCount} online
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Link href="/iot/register">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Dispositivo
            </Button>
          </Link>
        </div>
      </div>

      {/* Device Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Cpu className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No hay dispositivos</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Registra tu primer dispositivo IoT para comenzar
          </p>
          <Link href="/iot/register">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Dispositivo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Dispositivo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El dispositivo sera eliminado
              permanentemente junto con toda su telemetria y comandos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
