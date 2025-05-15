// components/ui/skeuo/drawer/SkeuoDrawerViewMain/ContentDrawer/DrawerActionBlock.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSession } from "@/app/context/SessionContext";
import { useLogout } from "@/hooks/useLogout";

export function DrawerActionBlock() {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { logout, loading } = useLogout();

  const handleLogout = () => {
    if (!loading) logout();
  };

  return (
    <>
      {/* ✨ Línea o Separador inferior */}
      <div className="my-1 h-[2px] rounded bg-gradient-to-r from-blue-500 to-blue-500 dark:from-pink-600 dark:to-purple-600" />

      {/* 🔘 Acción de sesión */}
      <div className="flex mt-4 px-4">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center justify-center w-3/4 py-2 px-2 bg-gradient-to-r from-blue-600 to-indigo-950 hover:from-blue-600 hover:to-indigo-600 
              dark:from-pink-600 dark:to-purple-600 dark:hover:from-pink-600 dark:hover:to-purple-500
              text-white rounded-md hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="font-semibold">
              {loading ? "Saliendo..." : "Cerrar sesión"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="flex items-center justify-center w-full py-2 px-2 bg-gradient-to-r from-blue-600 to-indigo-950 hover:from-blue-600 hover:to-indigo-600 
              dark:from-pink-600 dark:to-purple-600 dark:hover:from-pink-600 dark:hover:to-purple-500
              text-white rounded-md hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out"
          >
            Sign In
          </button>
        )}
      </div>
    </>
  );
}
