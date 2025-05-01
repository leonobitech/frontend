// File: app/(public)/layout.tsx
import BasicNavbar from "@/components/BasicNavbar";
import Footer from "@/components/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <BasicNavbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
