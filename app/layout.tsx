// File: app/layout.tsx
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import localFont from "next/font/local";
import { Metadata } from "next";
import { Providers } from "./providers";
import { InjectAsciiStyle } from "@/components/InjectAsciiStyle";

import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import Script from "next/script";

const interSans = localFont({
  src: [
    { path: "./fonts/Inter-Regular.woff2", weight: "400" },
    { path: "./fonts/Inter-Medium.woff2", weight: "500" },
    { path: "./fonts/Inter-SemiBold.woff2", weight: "600" },
    { path: "./fonts/Inter-Bold.woff2", weight: "700" },
  ],
  variable: "--font-inter-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Leonobitech",
    default: "Leonobitech",
  },
  description: "Automatizá tu negocio con soluciones AI personalizadas.",
  metadataBase: new URL("https://www.leonobitech.com"),
  other: {
    "facebook-domain-verification": "ohgwh41c3vpp2ssqc8zh8j12mhjc8b",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 🔐 Limpieza preventiva de cookies*/}
        <Script
          id="clean-cookies"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
      (function () {
        const keep = new Set(['accessKey', 'clientKey', 'sidebar_state']);
        const cookies = document.cookie.split(';').map(c => c.trim());

        cookies.forEach(function (c) {
          const [name] = c.split('=');
          if (keep.has(name)) return;

          // Borra la cookie para el dominio actual y la ruta raíz
          document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname;

          // Extra: intento de borrado en subrutas (solo si aplica)
          document.cookie = name + '=; Max-Age=0; path=/';

          console.warn('🍪 Cookie eliminada defensivamente:', name);
        });

        // 🎮 Firma visible en consola para devs
        console.log('%c🔥 leonobitech – infraestructura inteligente', 'font-weight: bold; color: #00ffcc; font-size: 12px');
      })();
    `,
          }}
        />
      </head>
      <body className={`${interSans.variable} antialiased`}>
        <InjectAsciiStyle />
        <Providers>
          <ResponsiveLayout>{children}</ResponsiveLayout>
        </Providers>
      </body>
    </html>
  );
}
