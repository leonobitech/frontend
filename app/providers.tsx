// app/providers.tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "@/app/context/SessionContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {" "}
          <SidebarProvider
            defaultOpen={false}
            style={
              {
                "--sidebar-width": "18rem",
                "--sidebar-width-icon": "4rem",
              } as React.CSSProperties
            }
          >
            {children}
            <Toaster position="bottom-right" richColors />
          </SidebarProvider>
        </NextThemesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
