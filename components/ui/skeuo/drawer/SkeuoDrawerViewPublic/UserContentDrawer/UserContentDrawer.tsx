// components/ui/skeuo/drawer/SkeuoDrawerViewPublic/UserContentDrawer/UserContentDrawer.tsx
"use client";

import { UserBanner } from "@/components/Sidebar/_3/SidebarFooter/UserBanner";
import "./UserContentDrawer.css";
import { UserAvatar } from "@/components/Sidebar/_3/SidebarFooter/UserAvatar";
import { UserSocialMedia } from "@/components/Sidebar/_3/SidebarFooter/UserSocialMedia";
import { UserProfile } from "@/components/Sidebar/_3/SidebarFooter/UserProfile";

export function UserContentDrawer() {
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
