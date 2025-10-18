export type GalleryCategory =
  | "Agent Apps"
  | "SDK Experiments"
  | "Workflows"
  | "LinkedIn Drops"
  | "MCP Connectors";

export interface GalleryItem {
  id: string;
  title: string;
  summary: string;
  category: GalleryCategory;
  sdk: string;
  tags: string[];
  highlights: string[];
  coverImage?: string;
  unsplashQuery?: string;
  link: string;
  repository?: string;
  likes: number;
  comments: number;
  publishedAt: string;
}

const galleryTemplates: GalleryItem[] = [
  {
    id: "odoo-mcp",
    title: "Odoo MCP Connector",
    summary:
      "Production-ready MCP server that enables Claude Desktop to control your Odoo CRM, contacts, calendar and email through OAuth2-authenticated tools.",
    category: "MCP Connectors",
    sdk: "Anthropic MCP SDK",
    tags: ["odoo", "crm", "oauth2", "typescript", "xmlrpc"],
    highlights: [
      "8 powerful tools for CRM, contacts & calendar",
      "OAuth2 + PKCE with RSA-signed JWT tokens",
      "Auto-progression: deals advance automatically",
      "Smart email templates for professional proposals",
      "Calendar conflict detection & availability checking",
      "Complete tutorial: build from scratch in 5 phases"
    ],
    coverImage: "/gallery/odoo-mcp.svg",
    unsplashQuery: "odoo crm business dashboard purple",
    link: "https://www.linkedin.com/in/felix-leonobitech",
    repository: "https://github.com/leonobitech/odoo-mcp",
    likes: 342,
    comments: 67,
    publishedAt: "2025-01-18",
  },
  {
    id: "mcp-agent-kit",
    title: "Leonobi Agent Kit",
    summary:
      "A starter kit that spins up MCP-compliant agents with guardrails and observability baked in.",
    category: "Agent Apps",
    sdk: "OpenAI MCP SDK",
    tags: ["typescript", "observability", "guardrails"],
    highlights: [
      "Scaffold multiple tools from a single manifest",
      "Realtime traces streamed to Supabase",
      "Prompt playground for iterating agent behaviour",
    ],
    coverImage: "/gallery/agent-kit.svg",
    unsplashQuery: "ai agent dashboard interface",
    link: "https://www.linkedin.com/posts/activity-agent-kit",
    repository: "https://github.com/leonobitech/mcp-agent-kit",
    likes: 184,
    comments: 23,
    publishedAt: "2024-11-15",
  },
  {
    id: "workflow-orchestrator",
    title: "Workflow Orchestrator",
    summary:
      "Composable workflow canvas that executes MCP tools as nodes for marketing and sales teams.",
    category: "Workflows",
    sdk: "Anthropic MCP SDK",
    tags: ["automation", "canvas", "sales-enablement"],
    highlights: [
      "Drag-and-drop MCP tools into branching flows",
      "Simulation mode with synthetic leads",
      "Exports runnable YAML specs for deployment",
    ],
    coverImage: "/gallery/workflow-orchestrator.svg",
    unsplashQuery: "workflow automation dashboard",
    link: "https://www.linkedin.com/posts/activity-workflow-orchestrator",
    likes: 132,
    comments: 11,
    publishedAt: "2024-10-22",
  },
  {
    id: "sdk-starter",
    title: "MCP SDK Starter",
    summary:
      "Rapid prototyping environment to assemble SDK primitives and publish experiments quickly.",
    category: "SDK Experiments",
    sdk: "Custom MCP SDK",
    tags: ["devexperience", "cli", "sandbox"],
    highlights: [
      "Ships with batteries-included linting and testing",
      "Push-to-LinkedIn workflow via GitHub Actions",
      "Comes with MCP manifest previewer",
    ],
    coverImage: "/gallery/sdk-starter.svg",
    unsplashQuery: "developer workspace code terminal",
    link: "https://www.linkedin.com/posts/activity-sdk-starter",
    repository: "https://github.com/leonobitech/mcp-sdk-starter",
    likes: 205,
    comments: 29,
    publishedAt: "2024-09-30",
  },
  {
    id: "linkedin-drops",
    title: "LinkedIn Drops Tracker",
    summary:
      "A living feed of LinkedIn content that documents our build-in-public journey with MCP apps.",
    category: "LinkedIn Drops",
    sdk: "Content Automation SDK",
    tags: ["content", "analytics", "automation"],
    highlights: [
      "Auto-syncs metrics from native posts",
      "Embeds carousels and code snippets",
      "Kickstarts conversations with DM templates",
    ],
    coverImage: "/gallery/linkedin-drops.svg",
    unsplashQuery: "linkedin analytics dashboard",
    link: "https://www.linkedin.com/posts/activity-linkedin-drops",
    likes: 318,
    comments: 54,
    publishedAt: "2024-08-12",
  },
  {
    id: "agent-lab",
    title: "Leonobi Agent Lab",
    summary:
      "Interactive playground to remix MCP agents, tools, and prompts directly in the browser.",
    category: "Agent Apps",
    sdk: "Browser MCP SDK",
    tags: ["playground", "prompt-engineering", "agents"],
    highlights: [
      "Live-edit manifests with instant validation",
      "Swap models and toolchains in seconds",
      "Share experiments via short URLs",
    ],
    coverImage: "/gallery/agent-lab.svg",
    unsplashQuery: "artificial intelligence interface hologram",
    link: "https://www.linkedin.com/posts/activity-agent-lab",
    likes: 267,
    comments: 42,
    publishedAt: "2024-07-05",
  },
  {
    id: "workflow-recipes",
    title: "Workflow Recipes",
    summary:
      "Reference recipes that demonstrate how MCP tools power recurring business processes.",
    category: "Workflows",
    sdk: "Multi-SDK Recipes",
    tags: ["templates", "operations", "growth"],
    highlights: [
      "Curated templates for onboarding, outreach, and research",
      "Inline explanations for non-technical teams",
      "Downloadable JSON ready for MCP runners",
    ],
    coverImage: "/gallery/workflow-recipes.svg",
    unsplashQuery: "business workflow whiteboard team",
    link: "https://www.linkedin.com/posts/activity-workflow-recipes",
    likes: 149,
    comments: 17,
    publishedAt: "2024-06-18",
  },
];

const GALLERY_DATASET_SIZE = 50;

function buildGalleryDataset(size = GALLERY_DATASET_SIZE): GalleryItem[] {
  const items: GalleryItem[] = [];

  for (let index = 0; index < size; index++) {
    const template = galleryTemplates[index % galleryTemplates.length];
    const iteration = Math.floor(index / galleryTemplates.length);
    const id =
      iteration === 0 ? template.id : `${template.id}-${iteration.toString().padStart(2, "0")}`;

    const publishedDate = new Date(template.publishedAt);
    publishedDate.setDate(publishedDate.getDate() - iteration * 7);

    items.push({
      ...template,
      id,
      title:
        iteration === 0
          ? template.title
          : `${template.title} • Variant ${iteration + 1}`,
      summary:
        iteration === 0
          ? template.summary
          : `${template.summary} (Iteration ${iteration + 1} of the build series).`,
      publishedAt: publishedDate.toISOString().split("T")[0],
    });
  }

  return items;
}

export const galleryItems = buildGalleryDataset();

export const featuredGalleryIds = [
  "odoo-mcp",
  "mcp-agent-kit",
  "workflow-orchestrator",
  "sdk-starter",
  "linkedin-drops",
];
