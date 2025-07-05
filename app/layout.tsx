export const dynamic = "force-static";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import localFont from "next/font/local";
// import Head from "next/head";
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
        <title>Leonobitech</title>
        <meta
          name="description"
          content="Empower your business with AI agents."
        />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content="Leonobitech" />
        <meta
          property="og:description"
          content="Empower your business with AI agents."
        />
        <meta
          property="og:image"
          content="https://www.leonobitech.com/opengraph-image.png"
        />
        <meta property="og:url" content="https://www.leonobitech.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Leonobitech" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Leonobitech" />
        <meta
          name="twitter:description"
          content="Empower your business with AI agents."
        />
        <meta
          name="twitter:image"
          content="https://www.leonobitech.com/opengraph-image.png"
        />
        <meta name="twitter:creator" content="@leonobitech" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          href="/favicon-32x32.png"
          sizes="32x32"
          type="image/png"
        />
        <link
          rel="icon"
          href="/favicon-16x16.png"
          sizes="16x16"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
          type="image/png"
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
