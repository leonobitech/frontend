// components/ui/skeuo/drawer/SkeuoDrawerViewMain/SkeuoDrawerViewMain.tsx
"use client";

import { HeaderDrawer } from "./HeaderDrawer/HeaderDrawer";
import { UserContentDrawer } from "./UserContentDrawer/UserContentDrawer";
import { ContentDrawer } from "./ContentDrawer/ContentDrawer";
import { useThemeWatcher } from "@/hooks/useThemeWatcher";

type ContentDrawerProps = {
  onClose?: () => void;
};

export function SkeuoDrawerViewMain({ onClose }: ContentDrawerProps) {
  const { theme } = useThemeWatcher();
  return (
    <>
      <HeaderDrawer theme={theme} />
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <UserContentDrawer />
        <ContentDrawer onClose={onClose} />
      </div>

      {/* ✨ Spaceador invisible */}
      <div
        className="mt-4 h-[70px] bg-transparent pointer-events-none"
        aria-hidden
      />
    </>
  );
}
