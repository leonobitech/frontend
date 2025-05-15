// components/ui/skeuo/drawer/SkeuoDrawerViewPublic/HeaderDrawer/HeaderDrawer.tsx
"use client";

import Image from "next/image";
import "./HeaderDrawer.css";
import type { ThemeValue } from "@/hooks/useThemeWatcher";

type HeaderDrawerProps = { theme: ThemeValue };

export function HeaderDrawer({ theme }: HeaderDrawerProps) {
  const gradientClass =
    theme === "system"
      ? "bg-gradient-to-r from-pink-600 to-purple-600"
      : theme === "dark"
      ? "bg-gradient-to-r from-pink-600 to-purple-600"
      : "bg-gradient-to-r from-blue-600 to-indigo-950";

  return (
    <div className={`header-drawer-container ${gradientClass}`}>
      <div className="header-drawer-content">
        <div className="logo-container">
          <div className="icon-wrapper">
            <Image
              src="/icon.png"
              alt="App Icon"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </div>
          <div className="logo-wrapper">
            <Image
              src="/logo_mobile.png"
              alt="App Logo"
              fill
              sizes="240px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
