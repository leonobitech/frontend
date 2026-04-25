export const dynamic = "force-static";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import localFont from "next/font/local";
import { Fraunces, Geist_Mono } from "next/font/google";
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

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Fraunces — serif display con carácter editorial para hero/titles del curso.
// Variable font con optical sizing que cambia carácter por tamaño. Italic para
// detalles. Se usa selectivamente (NO body) para preservar identidad.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
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
        {/* ⚡ Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />

        {/* 🔐 Limpieza preventiva de cookies (external script, no unsafe-inline needed) */}
        <Script src="/scripts/clean-cookies.js" strategy="beforeInteractive" />
        <meta name="robots" content="index, follow" />
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
        <meta name="author" content="Felix Figueroa" />
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
                  name: "Leonobitech",
                  url: "https://www.leonobitech.com",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://www.leonobitech.com/opengraph-image.png",
                  },
                  sameAs: [
                    "https://x.com/leonobitech",
                    "https://www.linkedin.com/company/leonobitech",
                    "https://github.com/leonobitech",
                    "https://www.instagram.com/leonobitech/",
                    "https://www.youtube.com/@leonobitech",
                  ],
                  contactPoint: {
                    "@type": "ContactPoint",
                    email: "info@leonobitech.com",
                    contactType: "customer service",
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.leonobitech.com/#website",
                  url: "https://www.leonobitech.com",
                  name: "Leonobitech",
                  description:
                    "Soluciones empresariales con inteligencia artificial. Agentes de voz, automatizacion inteligente, cursos y consultoria con el ecosistema Anthropic.",
                  publisher: {
                    "@id": "https://www.leonobitech.com/#organization",
                  },
                },
                {
                  "@type": "WebPage",
                  "@id": "https://www.leonobitech.com/#webpage",
                  url: "https://www.leonobitech.com",
                  name: "Leonobitech | Soluciones Empresariales con IA",
                  isPartOf: {
                    "@id": "https://www.leonobitech.com/#website",
                  },
                  about: {
                    "@id": "https://www.leonobitech.com/#organization",
                  },
                  description:
                    "Soluciones empresariales con inteligencia artificial. Agentes de voz, automatizacion inteligente, cursos y consultoria con el ecosistema Anthropic.",
                },
              ],
            }),
          }}
        />
      </head>

      <body
        className={`${interSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        <Providers>
          <ResponsiveLayout>{children}</ResponsiveLayout>
        </Providers>
      </body>
    </html>
  );
}
