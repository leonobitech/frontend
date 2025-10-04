"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Monitor, Fingerprint } from "lucide-react";
import { useSession } from "@/app/context/SessionContext";
import { ProfileTab } from "./components/ProfileTab";
import { SessionsTab } from "./components/SessionsTab";
import { SecurityTab } from "./components/SecurityTab";
import { PasskeyTab } from "./components/PasskeyTab";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const VALID_TABS = new Set(["profile", "sessions", "passkeys", "security"]);

export default function SettingsPage() {
  const { user, session, loading } = useSession();

  // 🚦 deep-link de tab via ?tab=
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialTab = useMemo(() => {
    const t = searchParams.get("tab") || "profile";
    return VALID_TABS.has(t) ? t : "profile";
  }, [searchParams]);

  const [tab, setTab] = useState<string>(initialTab);

  // Cuando cambia la query o se monta, asegurar estado del tab
  useEffect(() => {
    if (tab !== initialTab) setTab(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  // Cuando el usuario cambia el tab, reflejar en la URL (shallow)
  const handleTabChange = (next: string) => {
    setTab(next);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", next);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

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

      {/* 🔗 Tabs controlados por estado, sincronizados con ?tab= */}
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="passkeys" className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            <span className="hidden sm:inline">Passkeys</span>
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

        <TabsContent value="passkeys" className="space-y-4">
          <PasskeyTab />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
