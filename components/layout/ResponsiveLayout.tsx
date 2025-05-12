// components/layout/ResponsiveLayout.tsx
"use client";

import { DesktopLayout } from "@/components/layout/DesktopLayout";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/useIsMobile";

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout>{children}</DesktopLayout>
  );
}
