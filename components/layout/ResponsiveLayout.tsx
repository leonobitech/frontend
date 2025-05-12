// components/layout/ResponsiveLayout.tsx
"use client";

import { LayoutClient } from "@/components/LayoutClient";
import { MobileLayout } from "./MobileLayout";
import { useIsMobile } from "@/hooks/useIsMobile";

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <LayoutClient>{children}</LayoutClient>
  );
}
