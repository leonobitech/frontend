import Script from "next/script";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <PublicNavbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
