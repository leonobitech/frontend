// File: app/layout.tsx
import "./globals.css";
import localFont from "next/font/local";
import { Metadata } from "next";
import { Providers } from "./providers";

import LayoutClient from "@/components/LayoutClient";
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
    template: "%s | Felix Figueroa",
    default: "Felix Figueroa",
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
        {/* 🔐 Limpieza preventiva de cookies espía */}
        <Script
          id="clean-cookies"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
      (function () {
        const keep = ['accessKey', 'clientKey', 'sidebar:state'];
        const cookies = document.cookie.split(';').map(c => c.trim());

        cookies.forEach(function (c) {
          const name = c.split('=')[0];
          if (keep.includes(name) || name.startsWith('__cf') || name.startsWith('cf_')) return;

          document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname;
          console.warn('🍪 Cookie eliminada:', name);
        });
      })();
    `,
          }}
        />
      </head>
      <body className={`${interSans.variable} antialiased`}>
        <Providers>
          <LayoutClient>{children}</LayoutClient>
        </Providers>
      </body>
    </html>
  );
}
