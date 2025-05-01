"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/components/Sidebar/_3/SidebarFooter/hooks/useLogout";

export function LogoutButton() {
  const { logout, loading } = useLogout();

  return (
    <Button
      onClick={logout}
      size="sm"
      className="bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
                 dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
                 text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Saliendo..." : "Salir"}
    </Button>
  );
}
