import "./globals.css";
import localFont from "next/font/local";
import { Metadata } from "next";
import { ThemeProvider } from "./providers";
import Providers from "./providers";
import { Sidebar } from "@/components/Sidebar";
import BasicNavbar from "@/components/BasicNavbar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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
    template: "%s | Leonobitech",
    default: "Leonobitech | Felix Figueroa",
  },
  description:
    "Boost productivity with AI automation: streamline workflows, eliminate repetitive tasks, and enhance engagement using AI agents/chatbots, predictive analytics, and ML. Drive data-driven decisions.",

  metadataBase: new URL("https://www.leonobitech.com"),
  other: {
    "facebook-domain-verification": "ohgwh41c3vpp2ssqc8zh8j12mhjc8b",
  },
};

export const isAuthenticated = true; // Placeholder for authentication check

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
            <div className="flex min-h-screen">
              {isAuthenticated ? (
                <SidebarProvider
                  defaultOpen={false}
                  style={
                    {
                      "--sidebar-width": "18rem",
                      "--sidebar-width-icon": "4rem",
                    } as React.CSSProperties
                  }
                >
                  <Sidebar />
                  <SidebarInset className="flex flex-col flex-grow">
                    <div className="flex-grow relative">
                      {/* Enhanced Dynamic background */}
                      <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-300/30 to-indigo-400/30 dark:from-blue-500/20 dark:to-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob"></div>
                        <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-300/30 to-pink-400/30 dark:from-purple-500/20 dark:to-pink-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000"></div>
                        <div className="absolute left-1/3 top-1/3 w-1/3 h-1/3 bg-gradient-to-br from-yellow-300/30 to-red-400/30 dark:from-yellow-500/20 dark:to-red-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000"></div>
                      </div>
                      {/* Content wrapper */}
                      <div className="relative z-10 flex flex-col min-h-screen">
                        <Navbar />
                        <main className="flex-grow">{children}</main>
                        <Footer />
                      </div>
                    </div>
                  </SidebarInset>
                </SidebarProvider>
              ) : (
                <div className="flex-grow relative">
                  {/* Enhanced Dynamic background */}
                  <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-gradient-to-br from-blue-300/30 to-indigo-400/30 dark:from-blue-500/20 dark:to-indigo-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob"></div>
                    <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-300/30 to-pink-400/30 dark:from-purple-500/20 dark:to-pink-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000"></div>
                    <div className="absolute left-1/3 top-1/3 w-1/3 h-1/3 bg-gradient-to-br from-yellow-300/30 to-red-400/30 dark:from-yellow-500/20 dark:to-red-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000"></div>
                  </div>
                  {/* Content wrapper */}
                  <div className="relative z-10 flex flex-col min-h-screen">
                    <BasicNavbar />
                    <main className="flex-grow">{children}</main>
                    <Footer />
                  </div>
                </div>
              )}
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
