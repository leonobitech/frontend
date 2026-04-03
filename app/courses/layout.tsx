import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cursos | Leonobitech — Ecosistema Anthropic para Empresas",
  description:
    "Cursos profesionales sobre el ecosistema Anthropic: Claude API, agentes de IA, automatización empresarial. Aprende a construir soluciones de nivel enterprise.",
  keywords: [
    "cursos IA",
    "Claude API",
    "Anthropic",
    "agentes de IA",
    "automatización empresarial",
    "LLM enterprise",
    "MCP servers",
    "AI agents",
  ],
  openGraph: {
    title: "Cursos — Leonobitech",
    description:
      "Cursos profesionales sobre el ecosistema Anthropic para empresas.",
    type: "website",
    url: "https://www.leonobitech.com/courses",
    siteName: "Leonobitech",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cursos — Leonobitech",
    description:
      "Cursos profesionales sobre el ecosistema Anthropic para empresas.",
  },
  alternates: {
    canonical: "https://www.leonobitech.com/courses",
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
