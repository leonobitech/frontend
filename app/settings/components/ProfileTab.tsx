"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Check, ShieldCheck, User, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import type { ExtendedSessionUser } from "@/app/context/SessionContext";

interface ProfileTabProps {
  user: ExtendedSessionUser;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    bio: user.bio || "",
    website: user.website || "",
    location: user.location || "",
    socialTwitter: user.socialTwitter || "",
    socialInstagram: user.socialInstagram || "",
    socialYoutube: user.socialYoutube || "",
    socialGithub: user.socialGithub || "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [screenResolution, setScreenResolution] = useState("");

  useEffect(() => {
    setScreenResolution(`${window.screen.width}x${window.screen.height}`);
  }, []);

  // Helper para obtener badge del role
  const getRoleBadge = () => {
    switch (user.role) {
      case "admin":
        return {
          label: "Admin",
          icon: ShieldCheck,
          variant: "destructive" as const,
        };
      case "moderator":
        return {
          label: "Moderator",
          icon: Shield,
          variant: "default" as const,
        };
      case "user":
      default:
        return {
          label: "User",
          icon: User,
          variant: "secondary" as const,
        };
    }
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  // Mutation para subir avatar a n8n → Baserow
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      // Convertir file a base64
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

      const base64 = await toBase64(file);
      const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix

      // Enviar a Next.js API route (proxy a n8n)
      const response = await fetch("/api/settings/upload-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          filename: file.name,
          mimeType: file.type,
          fileData: base64Data,
          currentAvatarUrl: user.avatar, // Para borrar el anterior
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload avatar");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Avatar uploaded successfully");
      // Recargar página para ver nuevo avatar
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setAvatarPreview(null);
    },
  });

  // Mutation para eliminar avatar (usa el mismo endpoint de profile)
  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/settings/profile:remove-avatar:${requestId}`;

      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
        },
        credentials: "include",
        body: JSON.stringify({ avatar: `${window.location.origin}/avatar.png`, meta }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove avatar");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Avatar removed successfully");
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      bio: string;
      website?: string;
      location?: string;
      socialTwitter?: string;
      socialInstagram?: string;
      socialYoutube?: string;
      socialGithub?: string;
    }) => {
      const meta = {
        ...buildClientMetaWithResolution(screenResolution, {
          label: "leonobitech",
        }),
      };

      const requestId =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const idemKey = `/api/settings/profile:${requestId}`;

      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
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
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      // Recargar para actualizar session context
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handler para seleccionar archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG or WebP.');
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadAvatarMutation.mutate(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const hasChanges =
    formData.name !== (user.name || "") ||
    formData.bio !== (user.bio || "") ||
    formData.website !== (user.website || "") ||
    formData.location !== (user.location || "") ||
    formData.socialTwitter !== (user.socialTwitter || "") ||
    formData.socialInstagram !== (user.socialInstagram || "") ||
    formData.socialYoutube !== (user.socialYoutube || "") ||
    formData.socialGithub !== (user.socialGithub || "");

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
                src={avatarPreview || user.avatar || "/avatar.png"}
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
              {uploadAvatarMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Photo
                </Button>
                {user.avatar && !user.avatar.endsWith("/avatar.png") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAvatarMutation.mutate()}
                    disabled={uploadAvatarMutation.isPending || removeAvatarMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    {removeAvatarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP. Max 5MB.
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

          {/* Email Field (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              readOnly
              className="bg-muted cursor-default select-none"
              tabIndex={-1}
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

          {/* Location & Website */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Location & Website</h3>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Where are you based?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
              <p className="text-xs text-muted-foreground">
                Your personal or professional website
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Social Media</h3>

            <div className="space-y-2">
              <Label htmlFor="socialTwitter">Twitter / X</Label>
              <Input
                id="socialTwitter"
                type="url"
                value={formData.socialTwitter}
                onChange={(e) => setFormData({ ...formData, socialTwitter: e.target.value })}
                placeholder="https://x.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialInstagram">Instagram</Label>
              <Input
                id="socialInstagram"
                type="url"
                value={formData.socialInstagram}
                onChange={(e) => setFormData({ ...formData, socialInstagram: e.target.value })}
                placeholder="https://instagram.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialYoutube">YouTube</Label>
              <Input
                id="socialYoutube"
                type="url"
                value={formData.socialYoutube}
                onChange={(e) => setFormData({ ...formData, socialYoutube: e.target.value })}
                placeholder="https://youtube.com/@username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialGithub">GitHub</Label>
              <Input
                id="socialGithub"
                type="url"
                value={formData.socialGithub}
                onChange={(e) => setFormData({ ...formData, socialGithub: e.target.value })}
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          {/* Role (Read-only) */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Badge variant={roleBadge.variant} className="w-fit flex items-center gap-1.5 px-3 py-1.5">
              <RoleIcon className="h-3.5 w-3.5" />
              {roleBadge.label}
            </Badge>
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
                bio: user.bio || "",
                website: user.website || "",
                location: user.location || "",
                socialTwitter: user.socialTwitter || "",
                socialInstagram: user.socialInstagram || "",
                socialYoutube: user.socialYoutube || "",
                socialGithub: user.socialGithub || "",
              })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges}
              className={`min-w-[140px] ${updateProfileMutation.isPending ? 'pointer-events-none' : ''}`}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
