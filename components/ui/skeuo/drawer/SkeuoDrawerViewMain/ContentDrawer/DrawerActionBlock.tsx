"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSession } from "@/app/context/SessionContext";
import { useLogout } from "@/hooks/useLogout";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

type DrawerActionBlockProps = {
  onClose?: () => void;
};

export function DrawerActionBlock({ onClose }: DrawerActionBlockProps) {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { logout, loading } = useLogout();
  const wasLoading = useRef(false);

  // 🧠 Detectar transición de loading → false (logout completado)
  useEffect(() => {
    if (wasLoading.current && !loading) {
      onClose?.(); // 🎯 Cierra drawer una vez que el logout finalizó
    }
    wasLoading.current = loading;
  }, [loading, onClose]);

  const handleLogout = () => {
    if (!loading) logout();
  };

  const handleLoginRedirect = () => {
    onClose?.(); // ✨ Cierra el drawer si se pasó
    router.push("/login");
  };

  return (
    <>
      {/* ✨ Línea decorativa inferior */}
      <div className="my-1 h-0.5 rounded bg-linear-to-r from-blue-500 to-blue-500 dark:from-pink-600 dark:to-purple-600" />

      <div className="flex mt-4 px-4">
        <fieldset disabled={loading} className="w-full">
          {isAuthenticated ? (
            <Button
              size="lg"
              type="button"
              onClick={handleLogout}
              aria-busy={loading}
              aria-disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2 px-2 bg-linear-to-r from-blue-600 to-indigo-950
                hover:from-blue-600 hover:to-indigo-600
                dark:from-pink-600 dark:to-purple-600
                dark:hover:from-pink-600 dark:hover:to-purple-600/80
                text-white rounded-lg hover:shadow-lg hover:scale-105
                transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saliendo...
                </span>
              ) : (
                <span className="font-semibold">Cerrar sesión</span>
              )}
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleLoginRedirect}
              className="flex items-center justify-center gap-2 w-full h-10 py-2 px-2 bg-linear-to-r from-blue-600 to-indigo-950
                hover:from-blue-600 hover:to-indigo-600
                dark:from-pink-600 dark:to-purple-600
                dark:hover:from-pink-600 dark:hover:to-purple-600/80
                text-white rounded-lg hover:shadow-lg hover:scale-105
                transition-all duration-300 ease-out"
            >
              Iniciar sesión
            </button>
          )}
        </fieldset>
      </div>

      {/* ♿ Live region accesible para lectores de pantalla */}
      {loading && (
        <div role="status" aria-live="polite" className="sr-only">
          Cerrando sesión...
        </div>
      )}
    </>
  );
}
