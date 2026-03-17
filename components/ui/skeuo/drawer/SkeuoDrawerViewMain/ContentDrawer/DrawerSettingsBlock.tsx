// components/ui/skeuo/drawer/SkeuoDrawerViewMain/ContentDrawer/DrawerSettingsBlock.tsx
"use client";

import { Moon } from "lucide-react";
import ThemeSwitch from "@/components/ThemeSwitch";

export function DrawerSettingsBlock() {
  return (
    <div className="px-4 py-1.5 rounded-md">
      <div className="flex items-center w-full">
        <Moon
          className="mr-2 h-4 w-4 shrink-0 text-gray-500"
          aria-hidden="true"
        />
        <ThemeSwitch withTooltip={false} />
      </div>
    </div>
  );
}
