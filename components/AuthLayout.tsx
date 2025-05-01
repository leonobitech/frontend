"use client";

import { useSession } from "@/app/context/SessionContext";
import { Sidebar } from "@/components/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/Navbar";
import BasicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";
//import { useRouter } from "next/navigation";
//import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useSession();
  //const router = useRouter();

  // Redirección opcional si querés bloquear acceso
  // useEffect(() => {
  //   if (!loading && !user) router.push("/login");
  // }, [loading, user]);

  if (loading) {
    return <div className="text-center p-10">Cargando sesión...</div>;
  }

  const isAuthenticated = !!user;

  return (
    <div className="flex min-h-screen">
      {isAuthenticated ? (
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
              {/* Background + contenido */}
              <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <div className="flex-grow relative">
          <div className="relative z-10 flex flex-col min-h-screen">
            <BasicNavbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
}
