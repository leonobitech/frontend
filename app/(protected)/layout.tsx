// File: app/(protected)/layout.tsx
"use client";

import { useSession } from "@/app/context/SessionContext";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p className="text-muted-foreground text-sm">Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-10 text-red-500">
        No autorizado. Por favor inicia sesión.
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          "--sidebar-width": "18rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <Sidebar />
      <SidebarInset className="flex flex-col flex-grow">
        <div className="flex-grow relative">
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
