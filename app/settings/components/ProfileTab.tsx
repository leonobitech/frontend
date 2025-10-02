"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import type { ExtendedSessionUser } from "@/app/context/SessionContext";
import type { UpdateProfileData } from "@/types/settings";

interface ProfileTabProps {
  user: ExtendedSessionUser;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: user.name || "",
    email: user.email || "",
    bio: user.bio || "",
  });

  const [screenResolution, setScreenResolution] = useState("");

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // Mutation para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, meta }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const hasChanges =
    formData.name !== user.name ||
    formData.email !== user.email ||
    formData.bio !== (user.bio || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and how others see you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-start gap-6">
            <div className="relative">
              <Image
                src={user.avatar || "/avatar.png"}
                alt={user.name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
                unoptimized
              />
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
                {user.isVerified && (
                  <Check className="h-3 w-3 text-green-600" />
                )}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Label>Profile Picture</Label>
                {user.isVerified && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Verified
                  </span>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 2MB. (Coming soon)
              </p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              maxLength={100}
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
            />
            {user.isVerified ? (
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Email verified
              </p>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠ Email not verified
              </p>
            )}
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Brief description for your profile
              </p>
              <p className="text-xs text-muted-foreground">
                {formData.bio?.length || 0}/500
              </p>
            </div>
          </div>

          {/* Role (Read-only) */}
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-md bg-muted text-sm flex-1">
                {user.roleLabel}
              </div>
              {user.isAdmin && (
                <span className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-medium">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Member Since</Label>
              <p className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Last Updated</Label>
              <p className="text-sm font-medium">
                {new Date(user.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={!hasChanges || updateProfileMutation.isPending}
              onClick={() => setFormData({
                name: user.name || "",
                email: user.email || "",
                bio: user.bio || "",
              })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
