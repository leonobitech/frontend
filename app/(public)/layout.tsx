// app/(public)/layout.tsx
import { Metadata } from "next";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Leonobitech",
  description: "Automatizá tu negocio con soluciones AI personalizadas.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
