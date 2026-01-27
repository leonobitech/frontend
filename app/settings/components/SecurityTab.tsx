"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShieldCheck, Key, Bell } from "lucide-react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import type { ExtendedSessionUser } from "@/app/context/SessionContext";
import type { ChangePasswordData } from "@/types/settings";

interface SecurityTabProps {
  user: ExtendedSessionUser;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SecurityTab({ user }: SecurityTabProps) {
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [screenResolution, setScreenResolution] = useState("");

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // Mutation para cambiar contraseña
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/settings/security/password:${requestId}`;

      const response = await fetch("/api/settings/security/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
        },
        body: JSON.stringify({ ...data, meta }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  const isPasswordFormValid =
    passwordData.currentPassword &&
    passwordData.newPassword &&
    passwordData.confirmPassword &&
    passwordData.newPassword === passwordData.confirmPassword;

  return (
    <div className="space-y-4">
      {/* Account Security Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Security Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm">Email verified</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm">Passkey 2FA enabled</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm">Strong password set</span>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                placeholder="Enter your new password"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters with letters and numbers
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                placeholder="Confirm your new password"
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={!isPasswordFormValid || changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Your account is protected with passkey verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Passkey 2FA Enabled
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  You verify with your phone&apos;s biometrics on every login
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Manage your registered passkeys in the <strong>Passkeys</strong> tab.
          </p>
        </CardContent>
      </Card>

      {/* Security Notifications Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Security Notifications</CardTitle>
          </div>
          <CardDescription>
            Get notified about security events on your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Login Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </div>
            <Button variant="outline" disabled>
              Configure
            </Button>
          </div>

          <Separator />

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Suspicious Activity</p>
              <p className="text-sm text-muted-foreground">
                Alerts for unusual login attempts or activity
              </p>
            </div>
            <Button variant="outline" disabled>
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
