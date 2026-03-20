export const dynamic = "force-static";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Brand } from "@/components/Brand";
import Script from "next/script";

export const metadata = {
  metadataBase: new URL("https://www.leonobitech.com"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
    <html lang="es" suppressHydrationWarning>
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
        <title>Leonobitech | Agente de voz con IA conectado a Odoo</title>
        <meta
          name="description"
          content="Agente de voz con inteligencia artificial que atiende a tus clientes, gestiona ventas y opera Odoo automáticamente. Probalo en vivo."
        />
        <meta
          property="og:title"
          content="Leonobitech | Agente de voz con IA conectado a Odoo"
        />
        <meta
          property="og:description"
          content="Agente de voz con inteligencia artificial que atiende a tus clientes, gestiona ventas y opera Odoo automáticamente. Probalo en vivo."
        />
        <meta
          property="og:image"
          content="https://www.leonobitech.com/opengraph-image.png"
        />
        <meta
          property="og:image:alt"
          content="Leonobitech - Agente de voz con IA conectado a Odoo"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://www.leonobitech.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Leonobitech" />
        <meta property="og:locale" content="es_AR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Leonobitech | Agente de voz con IA conectado a Odoo"
        />
        <meta
          name="twitter:description"
          content="Agente de voz con inteligencia artificial que atiende a tus clientes, gestiona ventas y opera Odoo automáticamente. Probalo en vivo."
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
                  "description": "Agente de voz con IA que atiende clientes y opera Odoo automáticamente",
                  "publisher": {
                    "@id": "https://www.leonobitech.com/#organization"
                  }
                },
                {
                  "@type": "WebPage",
                  "@id": "https://www.leonobitech.com/#webpage",
                  "url": "https://www.leonobitech.com",
                  "name": "Leonobitech | Agente de voz con IA conectado a Odoo",
                  "isPartOf": {
                    "@id": "https://www.leonobitech.com/#website"
                  },
                  "about": {
                    "@id": "https://www.leonobitech.com/#organization"
                  },
                  "description": "Agente de voz con inteligencia artificial que atiende a tus clientes, gestiona ventas y opera Odoo automáticamente."
                }
              ]
            })
          }}
        />
      </head>

      <body className={`${interSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>
          <ResponsiveLayout>{children}</ResponsiveLayout>
        </Providers>
      </body>
    </html>
  );
}
