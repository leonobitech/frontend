"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Monitor, Smartphone, Tablet, LogOut, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import type { SessionContextResponse } from "@/types/sessions";
import type { ActiveSession } from "@/types/settings";

interface SessionsTabProps {
  currentSession: SessionContextResponse["session"];
}

function getDeviceIcon(device: string) {
  const deviceLower = device.toLowerCase();
  if (deviceLower.includes("mobile") || deviceLower.includes("phone")) {
    return Smartphone;
  }
  if (deviceLower.includes("tablet") || deviceLower.includes("ipad")) {
    return Tablet;
  }
  return Monitor;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function SessionsTab({ currentSession }: SessionsTabProps) {
  const queryClient = useQueryClient();

  const [screenResolution, setScreenResolution] = useState("");

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // Query para obtener todas las sesiones activas
  const { data: sessions, isLoading } = useQuery<ActiveSession[]>({
    queryKey: ["sessions", "active"],
    queryFn: async () => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const response = await fetch("/api/settings/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      return response.json();
    },
    enabled: !!screenResolution, // Solo ejecutar cuando screenResolution esté disponible
    refetchInterval: 30000, // Refresca cada 30 segundos
  });

  // Mutation para revocar una sesión
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/settings/sessions/${sessionId}:${requestId}`;

      const response = await fetch(`/api/settings/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({ meta }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to revoke session");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Session revoked successfully");
      queryClient.invalidateQueries({ queryKey: ["sessions", "active"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation para revocar todas las sesiones excepto la actual
  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/settings/sessions/revoke-all:${requestId}`;

      const response = await fetch("/api/settings/sessions/revoke-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({ meta }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to revoke sessions");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("All other sessions revoked");
      queryClient.invalidateQueries({ queryKey: ["sessions", "active"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const otherSessions = sessions?.filter((s) => !s.isCurrent) || [];

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices where you&apos;re currently logged in
              </CardDescription>
            </div>
            {otherSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => revokeAllMutation.mutate()}
                disabled={revokeAllMutation.isPending}
              >
                {revokeAllMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Revoke All Others
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Current Session */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {(() => {
                const DeviceIcon = getDeviceIcon(currentSession.device.device);
                return <DeviceIcon className="h-8 w-8 mt-1 text-primary" />;
              })()}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">
                    {currentSession.device.browser} on {currentSession.device.os}
                  </h3>
                  <Badge variant="default">Current Session</Badge>
                </div>

                {/* Device & Network Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{currentSession.device.ipAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{currentSession.device.timezone}</span>
                  </div>
                </div>

                {/* Session Timing */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1.5">
                    <i className="ri-time-line text-sm" />
                    <span>
                      Created: {new Date(currentSession.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <i className="ri-refresh-line text-sm" />
                    <span>Last active: {formatDate(currentSession.lastUsedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <i className="ri-timer-line text-sm" />
                    <span>
                      Expires: {new Date(currentSession.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Other Sessions */}
      {otherSessions.length > 0 ? (
        otherSessions.map((session) => {
          const DeviceIcon = getDeviceIcon(session.device.device);
          return (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <DeviceIcon className="h-8 w-8 mt-1 text-muted-foreground" />
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">
                          {session.device.browser} on {session.device.os}
                        </h3>
                        {session.isRevoked && (
                          <Badge variant="destructive">Revoked</Badge>
                        )}
                      </div>

                      {/* Device & Network Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{session.device.ipAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{session.device.timezone}</span>
                        </div>
                      </div>

                      {/* Session Timing */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1.5">
                          <i className="ri-time-line text-sm" />
                          <span>
                            Created: {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="ri-refresh-line text-sm" />
                          <span>Last active: {formatDate(session.lastUsedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="ri-timer-line text-sm" />
                          <span>
                            Expires: {new Date(session.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revoke Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeSessionMutation.mutate(session.id)}
                    disabled={revokeSessionMutation.isPending || session.isRevoked}
                    className="flex-shrink-0"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Revoke
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No other active sessions</h3>
            <p className="text-sm text-muted-foreground text-center">
              This is the only device you&apos;re currently logged in from
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
