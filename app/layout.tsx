export const dynamic = "force-static";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import localFont from "next/font/local";
import { Providers } from "./providers";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";

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
      <head>
        <meta name="robots" content="index, follow" />
        <title>Leonobitech</title>
        <meta
          name="description"
          content="Transform your business with AI-driven solutions that automate tasks, increase efficiency, and drive growth."
        />
        <meta
          property="og:title"
          content="Leonobitech U+2013 Transform your business with AI-Driven Solutions"
        />
        <meta
          property="og:description"
          content="Automate tasks, increase efficiency, and grow your business with powerful AI agents designed for modern companies."
        />
        <meta
          property="og:image"
          content="https://www.leonobitech.com/opengraph-image.png"
        />
        <meta
          property="og:image:alt"
          content="Transform your Business with AI-Driven Solutions."
        />
        <meta property="og:url" content="https://www.leonobitech.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Leonobitech" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Leonobitech" />
        <meta
          name="twitter:description"
          content="Transform your business with AI-driven solutions that automate tasks, increase efficiency, and drive growth."
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
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          href="https://www.leonobitech.com/favicon-32x32.png"
          sizes="32x32"
          type="image/png"
        />
        <link
          rel="icon"
          href="https://www.leonobitech.com/favicon-16x16.png"
          sizes="16x16"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href="https://www.leonobitech.com/apple-touch-icon.png"
          sizes="180x180"
          type="image/png"
        />
        <meta name="bimi" content="https://www.leonobitech.com/bimi.svg" />
        <meta name="author" content="Felix Figueroa"></meta>
      </head>

      <body className={`${interSans.variable} antialiased`}>
        <Providers>
          <ResponsiveLayout>{children}</ResponsiveLayout>
        </Providers>
      </body>
    </html>
  );
}
