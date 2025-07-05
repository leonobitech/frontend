// File: app/layout.tsx
export const dynamic = "force-static";
import "./globals.css";
import "remixicon/fonts/remixicon.css";
import localFont from "next/font/local";
import { Metadata } from "next";
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
        url: "https://www.leonobitech.com/opengraph-image.png", // asegúrate que exista en /public
        width: 1200,
        height: 630,
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
    images: ["https://www.leonobitech.com/opengraph-image.png"],
    creator: "@leonobitech", // si tenés cuenta de X (Twitter)
  },
  other: {
    "facebook-domain-verification": "ohgwh41c3vpp2ssqc8zh8j12mhjc8b",
    "google-site-verification": "TGUTliXw7lNKseUnaFRcNvajD7-GBnAzYfJEHBq0DCk",
    bimi: "https://www.leonobitech.com/bimi.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${interSans.variable} antialiased`}>
        <Providers>
          <ResponsiveLayout>{children}</ResponsiveLayout>
        </Providers>
      </body>
    </html>
  );
}
