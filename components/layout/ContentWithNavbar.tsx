//components/layout/ContentWithNavbar.tsx
"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSidebar } from "@/components/ui/sidebar";

export function ContentWithNavbar({ children }: { children: React.ReactNode }) {
  const { open: isSidebarOpen } = useSidebar();
  const showLogo = !isSidebarOpen;

  return (
    <div className="grow relative">
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar showLogo={showLogo} />
        <main className="grow">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
