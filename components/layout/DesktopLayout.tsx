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
  //const { isAuthenticated } = useSession();
  const isAuthenticated = true;

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
          {/* Enhanced Dynamic background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-linear-to-br from-blue-300/30 to-indigo-400/30 dark:from-blue-500/20 dark:to-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob"></div>
            <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-linear-to-br from-purple-300/30 to-pink-400/30 dark:from-purple-500/20 dark:to-pink-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000"></div>
            <div className="absolute left-1/3 top-1/3 w-1/3 h-1/3 bg-linear-to-br from-yellow-300/30 to-red-400/30 dark:from-yellow-500/20 dark:to-red-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000"></div>
          </div>
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
