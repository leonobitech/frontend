"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "@/app/context/SessionContext";
import { VoiceCallProvider } from "@/components/voice/VoiceCallContext";
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
          <VoiceCallProvider>
            {children}
          </VoiceCallProvider>
          <Toaster position="bottom-right" richColors />
        </NextThemesProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
