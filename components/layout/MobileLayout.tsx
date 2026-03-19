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
import Navbar from "../Navbar";
import Footer from "../Footer";

type Props = {
  children: ReactNode;
};

export function MobileLayout({ children }: Props) {
  const { isAuthenticated } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <SkeuoHeader
        scrollEffect
        publicMode={!isAuthenticated}
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
        <SkeuoDrawerViewMain onClose={() => setDrawerOpen(false)} />
      </SkeuoDrawerLayout>

      <main className={isAuthenticated ? "flex-1 pt-14 pb-16 px-4 overflow-y-auto" : "flex-1 pt-14 overflow-y-auto"}>
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </main>

      <Footer />
      {isAuthenticated && <SkeuoTabBar />}
    </div>
  );
}
