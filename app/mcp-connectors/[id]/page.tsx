import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { odooMcpConnector } from "@/data/mcp-connectors/odoo-mcp";
import ConnectorHero from "./components/ConnectorHero";
import QuickStartCard from "./components/QuickStartCard";
import ToolsShowcase from "./components/ToolsShowcase";
import FeaturesGrid from "./components/FeaturesGrid";
import BuildTutorial from "./components/BuildTutorial";
import ArchitectureSection from "./components/ArchitectureSection";
import CustomIntegrationCTA from "./components/CustomIntegrationCTA";

// Static connectors database (will grow to 30+)
const connectors = {
  "odoo-mcp": odooMcpConnector,
  // Future: "salesforce-mcp", "notion-mcp", etc.
};

type PageProps = {
  params: Promise<{ id: string }>;
};

async function resolveParams(params: PageProps["params"]) {
  return params instanceof Promise ? params : Promise.resolve(params);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await resolveParams(params);
  const connector = connectors[id as keyof typeof connectors];

  if (!connector) {
    return { title: "Connector Not Found | Leonobitech" };
  }

  return {
    title: `${connector.name} | MCP Connectors | Leonobitech`,
    description: connector.description,
    keywords: connector.keywords,
    openGraph: {
      title: connector.name,
      description: connector.tagline,
      images: connector.coverImage ? [{ url: connector.coverImage }] : [],
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(connectors).map((id) => ({ id }));
}

export default async function ConnectorPage({ params }: PageProps) {
  const { id } = await resolveParams(params);
  const connector = connectors[id as keyof typeof connectors];

  if (!connector) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <ConnectorHero connector={connector} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Quick Start */}
        <QuickStartCard connector={connector} />

        {/* Features Grid */}
        <FeaturesGrid features={connector.features} />

        {/* Tools Showcase */}
        <ToolsShowcase tools={connector.tools} />

        {/* Build Tutorial */}
        <BuildTutorial
          phases={connector.buildPhases}
          difficulty={connector.difficulty}
          estimatedTime={connector.estimatedTime}
          prerequisites={connector.prerequisites}
        />

        {/* Architecture */}
        <ArchitectureSection
          description={connector.architectureDescription}
          technologies={connector.technologies}
        />

        {/* CTA */}
        <CustomIntegrationCTA />
      </div>
    </div>
  );
}
