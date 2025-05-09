// app/providers.tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "@/app/context/SessionContext";
import { Toaster } from "@/components/ui/sonner"; // ✅ nuevo Toaster

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
          {/* ✅ Inyectamos Toaster aquí, dentro del contexto de Theme */}
          <Toaster position="bottom-right" richColors />
        </NextThemesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
