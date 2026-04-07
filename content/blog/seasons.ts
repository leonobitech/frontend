export interface Season {
  slug: string;
  title: string;
  course: string;
  description: string;
  order: number;
  status: "active" | "upcoming" | "completed";
}

export const seasons: Season[] = [
  {
    slug: "claude-101",
    title: "Claude 101",
    course: "Claude 101",
    description:
      "The fundamentals — what Claude is, how it works, and why it's different.",
    order: 1,
    status: "active",
  },
  {
    slug: "ai-fluency",
    title: "AI Fluency",
    course: "AI Fluency: Framework & Foundations",
    description:
      "The 4D Framework — Delegation, Description, Discernment, Diligence.",
    order: 2,
    status: "completed",
  },
  {
    slug: "claude-api",
    title: "Building with the Claude API",
    course: "Building with the Claude API",
    description:
      "API, streaming, structured output, tool use — the flagship technical course.",
    order: 3,
    status: "upcoming",
  },
  {
    slug: "claude-code",
    title: "Claude Code in Action",
    course: "Claude Code in Action",
    description:
      "Setup, context, custom commands, MCP, GitHub, hooks, and the SDK.",
    order: 4,
    status: "upcoming",
  },
  {
    slug: "claude-cowork",
    title: "Claude Cowork",
    course: "Introduction to Claude Cowork",
    description:
      "Task loop, plugins, skills, file & research workflows.",
    order: 5,
    status: "upcoming",
  },
  {
    slug: "mcp-intro",
    title: "Introduction to MCP",
    course: "Introduction to Model Context Protocol",
    description:
      "Build MCP servers & clients with Python.",
    order: 6,
    status: "upcoming",
  },
  {
    slug: "mcp-advanced",
    title: "MCP: Advanced Topics",
    course: "MCP: Advanced Topics",
    description:
      "Sampling, notifications, file system, transport mechanisms.",
    order: 7,
    status: "upcoming",
  },
  {
    slug: "agent-skills",
    title: "Agent Skills",
    course: "Introduction to Agent Skills",
    description:
      "Create, configure, and share Skills in Claude Code.",
    order: 8,
    status: "upcoming",
  },
  {
    slug: "subagents",
    title: "Subagents",
    course: "Introduction to Subagents",
    description:
      "Delegate tasks, manage context, specialized workflows.",
    order: 9,
    status: "upcoming",
  },
  {
    slug: "aws-bedrock",
    title: "Claude with Amazon Bedrock",
    course: "Claude with Amazon Bedrock",
    description: "AWS integration for Claude.",
    order: 10,
    status: "upcoming",
  },
  {
    slug: "gcp-vertex",
    title: "Claude with Google Cloud Vertex AI",
    course: "Claude with Google Cloud's Vertex AI",
    description: "Google Cloud integration for Claude.",
    order: 11,
    status: "upcoming",
  },
];

export function getSeasonBySlug(slug: string): Season | undefined {
  return seasons.find((s) => s.slug === slug);
}
