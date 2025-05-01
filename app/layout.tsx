// File: app/layout.tsx
import "./globals.css";
import localFont from "next/font/local";
import { Metadata } from "next";
import { ThemeProvider } from "./providers";
import Providers from "./providers";

const interSans = localFont({
  src: [
    { path: "./fonts/Inter-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Inter-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Inter-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Inter-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Felix Figueroa",
    default: "Felix Figueroa",
  },
  description:
    "Boost productivity with AI automation: streamline workflows, eliminate repetitive tasks, and enhance engagement using AI agents/chatbots, predictive analytics, and ML. Drive data-driven decisions.",
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
      <body className={`${interSans.variable} antialiased`}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
