"use client";

import "./SkeuoDrawerViewPublic.css";
import { HeaderDrawer } from "./HeaderDrawer/HeaderDrawer";
import { UserContentDrawer } from "./UserContentDrawer/UserContentDrawer";
import { ContentDrawer } from "./ContentDrawer/ContentDrawer";
import { useThemeWatcher } from "@/hooks/useThemeWatcher";

export function SkeuoDrawerViewPublic() {
  const { theme } = useThemeWatcher();
  return (
    <>
      <HeaderDrawer theme={theme} />
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <UserContentDrawer />
        <ContentDrawer />
      </div>

      {/* ✨ Spaceador invisible */}
      <div
        className="mt-4 h-[70px] bg-transparent pointer-events-none"
        aria-hidden
      />
    </>
  );
}
