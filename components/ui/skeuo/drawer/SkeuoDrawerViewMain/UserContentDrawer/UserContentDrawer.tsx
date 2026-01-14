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
        <div className="h-24 w-full rounded-t-lg bg-linear-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // No session - show login placeholder
  if (!isAuthenticated) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden shadow-inner p-2">
        <div className="h-24 w-full rounded-t-lg bg-linear-to-r from-blue-400 to-blue-600 dark:from-pink-400 dark:to-pink-600" />
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Inicia sesion
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Accede a tu cuenta para ver tu perfil
          </p>
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-pink-500 dark:hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Iniciar sesion
          </Link>
        </div>
      </div>
    );
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
