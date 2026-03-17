// File: components/LayoutClient.tsx
"use client";

//import { useSession } from "@/app/context/SessionContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useSession } from "@/app/context/SessionContext";
import { ContentWithNavbar } from "./ContentWithNavbar";
import type { CSSProperties, ReactNode } from "react";

export function DesktopLayout({ children }: { children: ReactNode }) {
  // 🎯 Muestra la Sidebar solo si no hay sesión
  const { isAuthenticated } = useSession();
  //const isAuthenticated = true;

  return (
    <div className="flex min-h-screen">
      {isAuthenticated ? (
        <SidebarProvider
          defaultOpen={false}
          style={
            {
              "--sidebar-width": "20rem",
              "--sidebar-width-icon": "4rem",
            } as CSSProperties
          }
        >
          <Sidebar />
          <SidebarInset className="flex flex-col grow">
            <ContentWithNavbar>{children}</ContentWithNavbar>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <div className="grow relative">
          {/* Content wrapper */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar showLogo={true} />
            <main className="grow">{children}</main>
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
}
