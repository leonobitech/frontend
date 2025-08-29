"use client";

import dynamic from "next/dynamic";

// Import dinámico para evitar SSR del Canvas
const CosmicBioCore = dynamic(
  () =>
    import("@/components/CosmicBioCore/CosmicBioCore").then(
      (m) => m.CosmicBioCore
    ),
  { ssr: false, loading: () => null }
);

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <CosmicBioCore
        status="open" // 👈 hardcodeado para que brille
        quality="high" // 👈 alta calidad visual
        useMic={false} // 👈 desactiva micrófono
        externalLevel={0.8} // 👈 nivel fijo para efectos fuertes
        onClick={() => {}} // 👈 placeholder vacío, no hace nada
      />
    </main>
  );
}
