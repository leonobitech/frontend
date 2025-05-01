import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { buildClientMeta } from "@/lib/clientMeta";

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = async () => {
    const meta = {
      ...buildClientMeta(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    };

    const res = await fetch("/api/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ meta }),
    });

    // ✅ Limpiar la cache del estado global
    queryClient.removeQueries({ queryKey: ["session"] });

    // ✅ Redirigir al login si todo salió bien
    if (res.ok) {
      // navegación a ruta pública con layout limpio
      router.push("/"); // o "/login"
    } else {
      const err = await res.json();
      console.error("❌ Logout failed:", err);
    }
  };

  return logout;
};
