// File: components/LayoutClient.tsx
"use client";

import { useSession } from "@/app/context/SessionContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session } = useSession();

  const showLogo = !session; // 🎯 Muestra el logo solo si no hay sesión
  const showSidebar = Boolean(user && session); // 🎯 Solo muestra Sidebar si hay sesión válida

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showLogo={showLogo} />
      <div className="flex flex-grow">
        {showSidebar && <Sidebar />}
        <main className="flex-grow">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
