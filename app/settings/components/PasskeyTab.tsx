"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Fingerprint, Trash2, Plus, Smartphone, Monitor, Tablet } from "lucide-react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { startRegistration } from "@simplewebauthn/browser";
import type { Passkey, PasskeyRegisterChallengeResponse, PasskeyListResponse } from "@/types/passkey";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");

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
    enabled: !!screenResolution, // Solo ejecutar cuando screenResolution esté disponible
  });

  // Mutation to register a new passkey
  const registerPasskeyMutation = useMutation({
    mutationFn: async (name?: string) => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/passkey/register/challenge:${requestId}`;

      // Step 1: Get registration challenge
      const challengeResponse = await fetch("/api/passkey/register/challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({ meta }),
        credentials: "include",
      });

      if (!challengeResponse.ok) {
        const error = await challengeResponse.json();
        throw new Error(error.message || "Failed to generate challenge");
      }

      const challengeData: PasskeyRegisterChallengeResponse =
        await challengeResponse.json();

      // Step 2: Use browser WebAuthn API to create credential
      let credential;
      try {
        credential = await startRegistration({ optionsJSON: challengeData.options });
      } catch (error) {
        // User cancelled or browser doesn't support WebAuthn
        throw new Error(
          error instanceof Error ? error.message : "Failed to create passkey"
        );
      }

      // Step 3: Verify credential with backend
      const verifyRequestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const verifyIdemKey = `/api/passkey/register/verify:${verifyRequestId}`;

      const verifyResponse = await fetch("/api/passkey/register/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": verifyRequestId,
          "Idempotency-Key": verifyIdemKey,
        },
        body: JSON.stringify({ credential, name, meta }),
        credentials: "include",
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.message || "Failed to verify passkey");
      }

      return verifyResponse.json();
    },
    onSuccess: () => {
      toast.success("Passkey registered successfully");
      queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      setIsDialogOpen(false);
      setPasskeyName("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation to delete a passkey
  const deletePasskeyMutation = useMutation({
    mutationFn: async (passkeyId: string) => {
      const response = await fetch(`/api/passkey?id=${passkeyId}`, {
        method: "DELETE",
        credentials: "include",
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

  const handleRegister = () => {
    const name = passkeyName.trim() || undefined;
    registerPasskeyMutation.mutate(name);
  };

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Passkeys</CardTitle>
              <CardDescription>
                Passwordless login using biometrics or security keys
              </CardDescription>
            </div>
            {passkeys && passkeys.length > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!screenResolution}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Passkey
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Passkey</DialogTitle>
                  <DialogDescription>
                    Create a new passkey for passwordless authentication. You&apos;ll be prompted
                    to use your device&apos;s biometric sensor or security key.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="passkey-name">
                      Name (optional)
                    </Label>
                    <Input
                      id="passkey-name"
                      placeholder="e.g., MacBook Pro, iPhone 13"
                      value={passkeyName}
                      onChange={(e) => setPasskeyName(e.target.value)}
                      disabled={registerPasskeyMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Give this passkey a memorable name
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={registerPasskeyMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegister}
                    disabled={registerPasskeyMutation.isPending}
                  >
                    {registerPasskeyMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Passkey
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePasskeyMutation.mutate(passkey.id)}
                    disabled={deletePasskeyMutation.isPending}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Fingerprint className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No passkeys yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add a passkey to enable quick and secure passwordless login
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!screenResolution}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Passkey
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Passkey</DialogTitle>
                  <DialogDescription>
                    Create a new passkey for passwordless authentication. You&apos;ll be prompted
                    to use your device&apos;s biometric sensor or security key.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="passkey-name">
                      Name (optional)
                    </Label>
                    <Input
                      id="passkey-name"
                      placeholder="e.g., MacBook Pro, iPhone 13"
                      value={passkeyName}
                      onChange={(e) => setPasskeyName(e.target.value)}
                      disabled={registerPasskeyMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Give this passkey a memorable name
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={registerPasskeyMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegister}
                    disabled={registerPasskeyMutation.isPending}
                  >
                    {registerPasskeyMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Passkey
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
