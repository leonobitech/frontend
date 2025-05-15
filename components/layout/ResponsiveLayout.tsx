// components/layout/ResponsiveLayout.tsx
"use client";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DesktopLayout } from "./DesktopLayout";
import { useEffect, useState } from "react";

export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout>{children}</DesktopLayout>
  );
}
