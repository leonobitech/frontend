// components/ui/skeuo/drawer/SkeuoDrawerViewMain/HeaderDrawer/HeaderDrawer.tsx
"use client";

import Image from "next/image";
import "./HeaderDrawer.css";
import type { ThemeValue } from "@/hooks/useThemeWatcher";
import { SkeuoToggleButton } from "@/components/ui/skeuo/button/SkeuoToggleButton";

type HeaderDrawerProps = {
  theme: ThemeValue;
  onClose?: () => void;
};

export function HeaderDrawer({ theme, onClose }: HeaderDrawerProps) {
  const gradientClass =
    theme === "system"
      ? "bg-linear-to-r from-pink-600 to-purple-600"
      : theme === "dark"
      ? "bg-linear-to-r from-pink-600 to-purple-600"
      : "bg-linear-to-r from-blue-600 to-indigo-950";

  return (
    <div className={`header-drawer-container ${gradientClass}`}>
      <div className="header-drawer-content">
        <div className="logo-container">
          <div className="icon-wrapper">
            <Image
              src="/icon_512x512.png"
              alt="Leonobitech"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-white">
            Leonobitech
          </span>
        </div>

        {onClose && (
          <SkeuoToggleButton
            isOpen={true}
            onToggle={onClose}
            size="md"
            title="Cerrar menú"
          />
        )}
      </div>
    </div>
  );
}
