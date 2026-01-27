"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Fingerprint, Trash2, Smartphone, Monitor, Tablet, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import type { Passkey, PasskeyListResponse } from "@/types/passkey";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function getDeviceIcon(device: string | null) {
  if (!device) return Monitor;
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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PasskeyTab() {
  const queryClient = useQueryClient();
  const [screenResolution, setScreenResolution] = useState("");

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // Query to get all passkeys
  const { data: passkeys, isLoading } = useQuery<Passkey[]>({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const response = await fetch("/api/passkey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ meta }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch passkeys");
      }

      const data: PasskeyListResponse = await response.json();
      return data.passkeys;
    },
    enabled: !!screenResolution,
  });

  // Mutation to delete a passkey
  const deletePasskeyMutation = useMutation({
    mutationFn: async (passkeyId: string) => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const response = await fetch(`/api/passkey?id=${passkeyId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ meta }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete passkey");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Passkey deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
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

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Passkeys
              </CardTitle>
              <CardDescription className="mt-1">
                Your registered passkeys for secure 2FA authentication
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-300">
              2FA Enabled
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Passkey List */}
      {passkeys && passkeys.length > 0 ? (
        passkeys.map((passkey) => {
          const DeviceIcon = getDeviceIcon(passkey.device?.device || null);
          return (
            <Card key={passkey.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <DeviceIcon className="h-8 w-8 mt-1 text-muted-foreground" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">
                          {passkey.name || "Unnamed Passkey"}
                        </h3>
                        <Badge variant="outline">
                          <Fingerprint className="h-3 w-3 mr-1" />
                          Passkey
                        </Badge>
                      </div>

                      {passkey.device && (
                        <div className="text-sm text-muted-foreground">
                          {passkey.device.browser} on {passkey.device.os}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1.5">
                          <i className="ri-time-line text-sm" />
                          <span>Created: {formatDate(passkey.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <i className="ri-refresh-line text-sm" />
                          <span>Last used: {formatDate(passkey.lastUsedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletePasskeyMutation.isPending}
                        className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        {deletePasskeyMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          Delete Passkey?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{passkey.name || "this passkey"}&quot;?
                          You will need to use your phone to configure a new passkey on your next login.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePasskeyMutation.mutate(passkey.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Passkey
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Passkey Configured</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Your account doesn&apos;t have a passkey configured. On your next login,
              you&apos;ll be prompted to set up a passkey using your phone for secure 2FA authentication.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
