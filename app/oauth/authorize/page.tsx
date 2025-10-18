import { Suspense } from "react";
import { Metadata } from "next";
import AuthorizeClient from "./components/AuthorizeClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export const metadata: Metadata = {
  title: "Authorize OAuth Client | Leonobitech",
  description: "Authorize application access to your Odoo account",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OAuthAuthorizePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Suspense fallback={<LoadingSpinner />}>
        <AuthorizeClient />
      </Suspense>
    </div>
  );
}
