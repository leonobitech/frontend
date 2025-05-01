// File: app/(protected)/layout.tsx
"use client";

import { useSession } from "@/app/context/SessionContext";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useSession();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p className="text-muted-foreground text-sm animate-pulse">
          Cargando sesión...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-6 text-center px-4 animate-fade-in">
        <p className="text-xl font-semibold text-red-500">
          No autorizado. Por favor inicia sesión para continuar.
        </p>
        <Button
          onClick={() => router.push("/login")}
          className="bg-gradient-to-r from-blue-600 to-indigo-900 text-white hover:from-blue-700 hover:to-indigo-800"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Ir al Login
        </Button>
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
