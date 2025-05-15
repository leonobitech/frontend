// components/layout/MobileLayout.tsx
"use client";

import "./MobileLayout.css";
import { ReactNode, useState } from "react";
import { SkeuoHeader } from "@/components/ui/skeuo/header/SkeuoHeader";
import { SkeuoToggleButton } from "@/components/ui/skeuo/button/SkeuoToggleButton";
import { SkeuoDrawerLayout } from "@/components/ui/skeuo/drawer/SkeuoDrawerLayout";
import { SkeuoTabBar } from "@/components/ui/skeuo/tabBar/SkeuoTabBar";
import { SkeuoDrawerViewMain } from "../ui/skeuo/drawer/SkeuoDrawerViewMain/SkeuoDrawerViewMain";
import { useSession } from "@/app/context/SessionContext";
import { SkeuoDrawerViewPublic } from "../ui/skeuo/drawer/SkeuoDrawerViewPublic/SkeuoDrawerViewPublic";

type Props = {
  children: ReactNode;
};

export function MobileLayout({ children }: Props) {
  const { user, isAuthenticated } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <SkeuoHeader
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

      <SkeuoDrawerLayout open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {isAuthenticated && user ? (
          <SkeuoDrawerViewMain user={user} />
        ) : (
          <SkeuoDrawerViewPublic />
        )}
      </SkeuoDrawerLayout>

      <main className="flex-1 pt-14 pb-16 px-4 overflow-y-auto">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-300/30 to-indigo-400/30 dark:from-blue-500/20 dark:to-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob"></div>
          <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-300/30 to-pink-400/30 dark:from-purple-500/20 dark:to-pink-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000"></div>
          <div className="absolute left-1/3 top-1/3 w-1/3 h-1/3 bg-gradient-to-br from-yellow-300/30 to-red-400/30 dark:from-yellow-500/20 dark:to-red-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </main>

      <SkeuoTabBar />
    </div>
  );
}
