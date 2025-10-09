import { Metadata } from "next";
import SavedGallery from "../components/SavedGallery";

export const metadata: Metadata = {
  title: "Saved Gallery | Leonobitech",
  description: "Tus favoritos de la galería Leonobitech MCP.",
};

export default function SavedGalleryPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Saved Gallery</h1>
        <p className="text-muted-foreground">
          Vuelve rápido a las apps MCP y LinkedIn drops que más te inspiran.
        </p>
      </div>
      <SavedGallery />
    </div>
  );
}
