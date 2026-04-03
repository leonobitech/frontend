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
        {/* ⚡ Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />

        {/* 🔐 Limpieza preventiva de cookies (external script, no unsafe-inline needed) */}
        <Script src="/scripts/clean-cookies.js" strategy="beforeInteractive" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.leonobitech.com" />
        <title>Leonobitech | Soluciones Empresariales con IA</title>
        <meta
          name="description"
          content="Soluciones empresariales con inteligencia artificial. Agentes de voz, automatizacion inteligente, cursos y consultoria con el ecosistema Anthropic. Avatar digital en tiempo real."
        />
        <meta
          name="keywords"
          content="soluciones empresariales IA, agente de voz, inteligencia artificial, cursos Anthropic, Claude API, automatizacion empresarial, avatar digital, MCP servers, agentes IA, LLM enterprise, consultoria IA"
        />
        <meta
          property="og:title"
          content="Leonobitech | Soluciones Empresariales con IA"
        />
        <meta
          property="og:description"
          content="Soluciones empresariales con inteligencia artificial. Agentes de voz, automatizacion inteligente, cursos y consultoria con el ecosistema Anthropic."
        />
        <meta
          property="og:image"
          content="https://www.leonobitech.com/opengraph-image.png"
        />
        <meta
          property="og:image:alt"
          content="Leonobitech — Soluciones Empresariales con IA"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://www.leonobitech.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Leonobitech" />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Leonobitech | Soluciones Empresariales con IA"
        />
        <meta
          name="twitter:description"
          content="Soluciones empresariales con inteligencia artificial. Agentes de voz, automatizacion inteligente, cursos y consultoria con el ecosistema Anthropic."
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
        className={`${interSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
          <ResponsiveLayout>{children}</ResponsiveLayout>
        </Providers>
      </body>
    </html>
  );
}
