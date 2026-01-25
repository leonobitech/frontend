export const dynamic = "force-static";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import localFont from "next/font/local";
import { Providers } from "./providers";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Brand } from "@/components/Brand";
import Script from "next/script";

export const metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

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
        const keep = new Set(['accessKey', 'clientKey', 'sidebar_state', 'clientMeta', '__next_hmr_refresh_hash__']);
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
        console.log('%c🔥 leonobitech - infraestructura inteligente', 'font-weight: bold; color: #00ffcc; font-size: 12px');
      })();
    `,
          }}
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.leonobitech.com" />
        <title>Leonobitech | MCP-Native AI Apps & Agent Development</title>
        <meta
          name="description"
          content="Transform your business with AI Solutions, automate tasks, increase efficiency, and grow your business with powerful AI agents designed for modern companies."
        />
        <meta
          property="og:title"
          content="Leonobitech - Your Business, in Real-Time AI Mode"
        />
        <meta
          property="og:description"
          content="Transform your business with AI Solutions, automate tasks, increase efficiency, and grow your business with powerful AI agents designed for modern companies."
        />
        <meta
          property="og:image"
          content="https://www.leonobitech.com/opengraph-image.png"
        />
        <meta
          property="og:image:alt"
          content="Leonobitech - Your Business, in Real-Time AI Mode"
        />
        <meta property="og:url" content="https://www.leonobitech.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Leonobitech" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Leonobitech - Your Business, in Real-Time AI Mode."
        />
        <meta
          name="twitter:description"
          content="Transform your business with AI Solutions, automate tasks, increase efficiency, and grow your business with powerful AI agents designed for modern companies."
        />
        <meta
          name="twitter:image"
          content="https://www.leonobitech.com/opengraph-image.png"
        />
        <meta name="twitter:creator" content="@leonobitech" />
        <meta
          name="facebook-domain-verification"
          content="ohgwh41c3vpp2ssqc8zh8j12mhjc8b"
        />
        <meta
          name="google-site-verification"
          content="TGUTliXw7lNKseUnaFRcNvajD7-GBnAzYfJEHBq0DCk"
        />
        <meta property="fb:app_id" content="1357634195387747" />
        <meta name="bimi" content="https://www.leonobitech.com/bimi.svg" />
        <meta name="author" content="Felix Figueroa"></meta>
        <meta name="date" content="2025-07-04" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.leonobitech.com/#organization",
                  "name": "Leonobitech",
                  "url": "https://www.leonobitech.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.leonobitech.com/opengraph-image.png"
                  },
                  "sameAs": [
                    "https://x.com/leonobitech",
                    "https://www.linkedin.com/company/leonobitech",
                    "https://github.com/leonobitech",
                    "https://www.instagram.com/leonobitech/",
                    "https://www.youtube.com/@leonobitech"
                  ],
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "email": "info@leonobitech.com",
                    "contactType": "customer service"
                  }
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.leonobitech.com/#website",
                  "url": "https://www.leonobitech.com",
                  "name": "Leonobitech",
                  "description": "Build MCP-native AI apps with AgentKit, LangGraph, and custom SDKs",
                  "publisher": {
                    "@id": "https://www.leonobitech.com/#organization"
                  }
                },
                {
                  "@type": "WebPage",
                  "@id": "https://www.leonobitech.com/#webpage",
                  "url": "https://www.leonobitech.com",
                  "name": "Leonobitech | MCP-Native AI Apps & Agent Development",
                  "isPartOf": {
                    "@id": "https://www.leonobitech.com/#website"
                  },
                  "about": {
                    "@id": "https://www.leonobitech.com/#organization"
                  },
                  "description": "Transform your business with AI Solutions, automate tasks, increase efficiency, and grow your business with powerful AI agents designed for modern companies."
                }
              ]
            })
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
