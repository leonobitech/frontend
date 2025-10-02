"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Monitor } from "lucide-react";
import { useSession } from "@/app/context/SessionContext";
import { ProfileTab } from "./components/ProfileTab";
import { SessionsTab } from "./components/SessionsTab";
import { SecurityTab } from "./components/SecurityTab";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { user, session, loading } = useSession();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need to be logged in to access settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileTab user={user} />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SessionsTab currentSession={session} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
