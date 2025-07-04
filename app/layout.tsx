// File: app/layout.tsx
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import localFont from "next/font/local";
import { Metadata } from "next";
import { Providers } from "./providers";

import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import Script from "next/script";
import { Brand } from "../components/Brand";

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
  robots: {
    index: true,
    follow: true,
  },
  title: {
    template: "%s | Leonobitech",
    default: "Leonobitech",
  },
  description:
    "Empower your business with AI agents, boost productivity and say goodbye to repetitive tasks to focus on what truly matters.",
  metadataBase: new URL("https://www.leonobitech.com"),

  manifest: "/manifest.webmanifest",
  themeColor: "#000000",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Leonobitech",
    description:
      "Empower your business with AI agents, boost productivity and say goodbye to repetitive tasks to focus on what truly matters.",
    url: "https://www.leonobitech.com",
    siteName: "Leonobitech",
    images: [
      {
        url: "/opengraph-image.png", // asegúrate que exista en /public
        width: 1686,
        height: 882,
        alt: "Leonobitech",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leonobitech",
    description:
      "Empower your business with AI agents, boost productivity and say goodbye to repetitive tasks to focus on what truly matters.",
    images: ["/opengraph-image.png"],
    creator: "@leonobitech", // si tenés cuenta de X (Twitter)
  },
  other: {
    "facebook-domain-verification": "ohgwh41c3vpp2ssqc8zh8j12mhjc8b",
    "google-site-verification": "TGUTliXw7lNKseUnaFRcNvajD7-GBnAzYfJEHBq0DCk",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Brand />
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
        <Providers>
          <ResponsiveLayout>{children}</ResponsiveLayout>
        </Providers>
      </body>
    </html>
  );
}
