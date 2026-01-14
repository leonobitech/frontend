// components/ui/skeuo/drawer/SkeuoDrawerViewMain/UserContentDrawer/UserContentDrawer.tsx
"use client";

import { UserBanner } from "@/components/Sidebar/_3/SidebarFooter/UserBanner";
import "./UserContentDrawer.css";
import { UserAvatar } from "@/components/Sidebar/_3/SidebarFooter/UserAvatar";
import { UserSocialMedia } from "@/components/Sidebar/_3/SidebarFooter/UserSocialMedia";
import { UserProfile } from "@/components/Sidebar/_3/SidebarFooter/UserProfile";
import { useSession } from "@/app/context/SessionContext";
import { LogIn } from "lucide-react";
import Link from "next/link";

export function UserContentDrawer() {
  const { isAuthenticated, loading } = useSession();

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden shadow-inner p-2">
        <div className="h-12 w-full rounded-lg bg-linear-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
      </div>
    );
  }

  // No session - show login button at top
  if (!isAuthenticated) {
    return <></>;
  }

  // Authenticated - show full user content
  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-inner p-2">
      {/* 🔳 Banner */}
      <UserBanner />

      {/* 🧑‍🎤 Avatar + Redes */}
      <div className="relative -mt-32 px-4 flex justify-between items-end z-10">
        <UserAvatar status="online" size="large" />
        <UserSocialMedia className="translate-y-44" />
      </div>

      {/* 👤 Perfil */}
      <div>
        <UserProfile />
      </div>
    </div>
  );
}
