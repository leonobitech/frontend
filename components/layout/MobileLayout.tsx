// components/layout/MobileLayout.tsx
"use client";

import "./MobileLayout.css";
import { ReactNode, useState } from "react";
import { SkeuoHeader } from "@/components/ui/skeuo/header/SkeuoHeader";
import { SkeuoToggleButton } from "@/components/ui/skeuo/button/SkeuoToggleButton";
import { SkeuoDrawer } from "@/components/ui/skeuo/drawer/SkeuoDrawer";
import { SkeuoTabBar } from "@/components/ui/skeuo/tabBar/SkeuoTabBar";

type Props = {
  children: ReactNode;
};

export function MobileLayout({ children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <SkeuoHeader
        title="Mi App"
        scrollEffect
        rightSlot={
          <SkeuoToggleButton
            isOpen={drawerOpen}
            onToggle={() => setDrawerOpen(!drawerOpen)}
            size="md"
            title="Abrir menú de navegación"
          />
        }
      />

      <SkeuoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 pt-14 pb-16 px-4 overflow-y-auto">
        {children}
      </main>

      <SkeuoTabBar />
    </div>
  );
}
