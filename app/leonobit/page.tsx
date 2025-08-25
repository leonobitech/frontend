"use client";
import { toast } from "sonner";
import { buildClientMetaWithResolution } from "@/lib/clientMeta";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScreenResolution } from "@/hooks/useScreenResolution";

export default function LeonobitPage() {
  const { user, session, loading } = useSessionGuard();
  const screenResolution = useScreenResolution();

  const connect = async () => {
    try {
      const meta = buildClientMetaWithResolution(screenResolution, {
        label: "leonobitech",
        path: "/api/leonobit",
      });

      const res = await fetch("/api/leonobit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ meta, user, session }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
      toast.success(json?.message || "Conectado ✅", {
        icon: "🚀",
        duration: 1200,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
      console.error(msg);
    }
  };

  return (
    <div>
      <Button
        onClick={connect}
        size="sm"
        className="bg-gradient-to-r from-indigo-950 to-blue-500 hover:from-blue-600 hover:to-indigo-600 
                 dark:from-purple-700 dark:to-pink-500 dark:hover:from-pink-600 dark:hover:to-purple-600
                 text-white transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
        disabled={loading}
      >
        <Mic className="mr-2 h-4 w-4" />
        {loading ? "Connecting..." : "Connect"}
      </Button>
    </div>
  );
}
