"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSession } from "@/app/context/SessionContext";
import { useLogout } from "@/hooks/useLogout";
import { Spinner } from "@/components/ui/spinner";

export function DrawerActionBlock() {
  const router = useRouter();
  const { isAuthenticated } = useSession();
  const { logout, loading } = useLogout();

  const handleLogout = () => {
    if (!loading) logout();
  };

  return (
    <>
      {/* ✨ Línea decorativa inferior */}
      <div className="my-1 h-[2px] rounded bg-gradient-to-r from-blue-500 to-blue-500 dark:from-pink-600 dark:to-purple-600" />

      <div className="flex mt-4 px-4">
        <fieldset disabled={loading} className="w-full">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              aria-busy={loading}
              aria-disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2 px-2 bg-gradient-to-r from-blue-600 to-indigo-950
                hover:from-blue-600 hover:to-indigo-600
                dark:from-pink-600 dark:to-purple-600
                dark:hover:from-pink-600 dark:hover:to-purple-600/80
                text-white rounded-md hover:shadow-lg hover:scale-105
                transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
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
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="flex items-center justify-center gap-2 w-full py-2 px-2 bg-gradient-to-r from-blue-600 to-indigo-950
                hover:from-blue-600 hover:to-indigo-600
                dark:from-pink-600 dark:to-purple-600
                dark:hover:from-pink-600 dark:hover:to-purple-600/80
                text-white rounded-md hover:shadow-lg hover:scale-105
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
