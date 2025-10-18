import type { McpConnector } from "@/types/mcp-connector";

/**
 * Odoo MCP Connector - Complete data for MCP Gallery
 */
export const odooMcpConnector: McpConnector = {
  // Basic metadata
  id: "odoo-mcp",
  name: "Odoo MCP Server",
  tagline: "Control your Odoo CRM, contacts, calendar and email from Claude Desktop",
  description:
    "A production-ready MCP server that enables Claude Desktop to interact with your Odoo instance through OAuth2-authenticated tools. Manage leads, schedule meetings, send proposals, and automate your sales workflow with natural language.",

  // Visual assets
  coverImage: "/gallery/odoo-mcp.svg",
  demoVideo: "https://www.linkedin.com/in/felix-leonobitech",

  // Technical details
  category: "CRM",
  targetPlatform: "Odoo",
  sdk: "Anthropic MCP SDK v1.20.0",
  version: "2.0.0",
  nodeVersion: ">=22.20.0",

  // Features
  tools: [
    {
      name: "odoo_get_leads",
      description: "Fetch CRM leads with advanced filtering by stage, type, and limit",
      category: "CRM",
      example: 'Get the last 5 qualified leads\n→ odoo_get_leads({"limit": 5, "stage": "Qualified"})',
      exampleOutput: "Returns list of leads with contact info, revenue, stage, and creation date",
    },
    {
      name: "odoo_create_lead",
      description: "Create new leads with automatic contact creation and partner linking",
      category: "CRM",
      example:
        'Create lead "Acme Corp" with email\n→ odoo_create_lead({"name": "Acme Corp Integration", "email": "contact@acme.com"})',
      exampleOutput: "Returns new lead ID and automatically creates/links partner contact",
    },
    {
      name: "odoo_get_opportunities",
      description: "Track sales opportunities with revenue filtering and stage visibility",
      category: "CRM",
      example:
        'Get opportunities over $10k\n→ odoo_get_opportunities({"minAmount": 10000, "limit": 10})',
      exampleOutput: "Returns opportunities sorted by expected revenue with deal stages",
    },
    {
      name: "odoo_update_deal_stage",
      description: "Move deals through your sales pipeline (New → Qualified → Proposition → Won)",
      category: "CRM",
      example: 'Move deal #45 to Proposition\n→ odoo_update_deal_stage({"opportunityId": 45, "stageName": "Proposition"})',
      exampleOutput: "Updates stage and logs activity in Odoo chatter",
    },
    {
      name: "odoo_search_contacts",
      description: "Search customers and partners by name, email, or phone",
      category: "Contacts",
      example: 'Find contact "John"\n→ odoo_search_contacts({"query": "John", "limit": 5})',
      exampleOutput: "Returns matching contacts with full details (email, phone, address)",
    },
    {
      name: "odoo_create_contact",
      description: "Add new contacts to your database (individuals or companies)",
      category: "Contacts",
      example:
        'Create company contact\n→ odoo_create_contact({"name": "Tech Solutions Inc", "email": "info@techsol.com", "isCompany": true})',
      exampleOutput: "Returns new partner ID ready to link to leads/opportunities",
    },
    {
      name: "odoo_schedule_meeting",
      description:
        "Book meetings with automatic availability checking and conflict detection",
      category: "Calendar",
      example:
        'Schedule demo meeting\n→ odoo_schedule_meeting({"name": "Product Demo", "opportunityId": 23, "start": "2025-01-20 14:00:00", "duration": 1})',
      exampleOutput:
        "Creates calendar event, checks conflicts, logs to chatter, and auto-progresses deal stage",
    },
    {
      name: "odoo_send_email",
      description:
        "Send emails linked to opportunities with professional templates and auto-progression",
      category: "Communication",
      example:
        'Send follow-up email\n→ odoo_send_email({"opportunityId": 23, "subject": "Follow-up: Product Demo", "body": "<p>Thanks for your time...</p>"})',
      exampleOutput:
        "Sends email via Odoo SMTP, logs to chatter, and advances deal to Qualified stage",
    },
  ],

  features: [
    "🔐 OAuth2 + PKCE authentication with RSA-signed JWT tokens",
    "🤖 Auto-progression: deals advance automatically when you send emails or schedule meetings",
    "📧 Professional email templates for proposals with HTML formatting",
    "📅 Calendar conflict detection and availability checking",
    "💬 Complete chatter integration - all actions logged in Odoo's activity feed",
    "🔄 Token auto-refresh with Redis caching for high performance",
    "🎯 Smart contact creation - automatically links partners to leads",
    "📊 Pipeline visibility with stage tracking and revenue forecasting",
  ],

  // Installation
  installCommand: "npx @leonobitech/odoo-mcp",
  envVariables: [
    {
      name: "ODOO_URL",
      description: "Your Odoo instance URL",
      required: true,
      example: "https://your-company.odoo.com",
    },
    {
      name: "ODOO_DB",
      description: "Odoo database name",
      required: true,
      example: "production",
    },
    {
      name: "ODOO_USERNAME",
      description: "Your Odoo user email",
      required: true,
      example: "admin@company.com",
    },
    {
      name: "ODOO_API_KEY",
      description: "Odoo API key (Settings > Users > API Keys)",
      required: true,
      example: "abc123def456...",
    },
    {
      name: "REDIS_HOST",
      description: "Redis server host for token storage",
      required: false,
      default: "localhost",
    },
    {
      name: "REDIS_PORT",
      description: "Redis server port",
      required: false,
      default: "6379",
    },
    {
      name: "REDIS_PASSWORD",
      description: "Redis password (if required)",
      required: false,
    },
  ],

  claudeDesktopConfig: `{
  "mcpServers": {
    "odoo": {
      "command": "npx",
      "args": ["-y", "@leonobitech/odoo-mcp"],
      "env": {
        "ODOO_URL": "https://your-odoo-instance.com",
        "ODOO_DB": "your-database",
        "ODOO_USERNAME": "your-email@example.com",
        "ODOO_API_KEY": "your-api-key"
      }
    }
  }
}`,

  // Tutorial content
  buildPhases: [
    {
      number: 1,
      title: "Minimal MCP Server",
      duration: "15 min",
      goal: "Create a Hello World MCP server that responds to a simple ping tool",
      description:
        "Learn the basics of MCP by creating a minimal server with health check and a single ping tool. This phase establishes the foundation: Express server, MCP SDK integration, and basic tool definition.",
      steps: [
        {
          title: "Initialize Project",
          description: "Set up a new Node.js project with TypeScript and MCP SDK",
          codeSnippets: [
            {
              filename: "package.json",
              language: "json",
              code: `{
  "name": "@leonobitech/odoo-mcp",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.0",
    "express": "^5.1.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.1",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}`,
              explanation:
                "Basic package.json with MCP SDK and Express. We use 'type: module' for ES modules.",
            },
            {
              filename: "src/index.ts",
              language: "typescript",
              code: `import express from "express";

const app = express();
const PORT = 8100;

app.use(express.json());

app.get("/healthz", (req, res) => {
  res.json({ status: "ok", service: "odoo-mcp" });
});

app.listen(PORT, () => {
  console.log(\`[odoo-mcp] Server listening on port \${PORT}\`);
});`,
              explanation: "Minimal Express server with health check endpoint",
              highlights: [7, 8, 9, 12],
            },
          ],
          checkpoints: [
            "✅ npm install completes successfully",
            "✅ npm run dev starts server",
            "✅ GET http://localhost:8100/healthz returns {status: 'ok'}",
          ],
        },
        {
          title: "Add First MCP Tool",
          description: "Implement a simple ping tool to test MCP integration",
          codeSnippets: [
            {
              filename: "src/routes/mcp.ts",
              language: "typescript",
              code: `import { Router } from "express";

export const mcpRouter = Router();

mcpRouter.post("/ping", (req, res) => {
  const message = req.body?.message || "";
  res.json({
    result: message ? \`pong: \${message}\` : "pong"
  });
});`,
              explanation: "Simple ping tool that echoes back a message",
              highlights: [5, 6, 7],
            },
          ],
          checkpoints: [
            "✅ POST /mcp/ping returns pong",
            '✅ POST /mcp/ping with {"message": "hello"} returns "pong: hello"',
          ],
        },
      ],
      filesCreated: ["package.json", "tsconfig.json", "src/index.ts", "src/routes/mcp.ts"],
    },
    {
      number: 2,
      title: "OAuth2 Authentication",
      duration: "30 min",
      goal: "Implement secure OAuth2 + PKCE flow with RSA-signed JWT tokens",
      description:
        "Add production-grade authentication: OAuth2 authorization server, PKCE for security, JWT token signing with RSA keys, and Redis for token storage. This is the security backbone of your connector.",
      steps: [],
      filesCreated: [
        "src/routes/oauth.ts",
        "src/lib/auth.ts",
        "src/lib/keys.ts",
        "src/lib/pkce.ts",
        "src/lib/redis.ts",
        "src/scripts/generateKeys.ts",
      ],
    },
    {
      number: 3,
      title: "Odoo XML-RPC Client",
      duration: "20 min",
      goal: "Connect to Odoo via XML-RPC and implement authentication",
      description:
        "Build the Odoo client that communicates with Odoo's XML-RPC API. Learn how to authenticate with API keys, execute methods on Odoo models, and handle responses.",
      steps: [],
      filesCreated: ["src/lib/odoo.ts", "src/types/xmlrpc.d.ts"],
    },
    {
      number: 4,
      title: "First Real Tool: Get Leads",
      duration: "15 min",
      goal: "Create your first production tool that fetches CRM leads from Odoo",
      description:
        "Transform the Odoo client into an MCP tool. Learn the pattern: input validation with Zod, calling Odoo methods, error handling, and returning formatted data to Claude.",
      steps: [],
      filesCreated: ["src/tools/odoo/crm/get-leads.tool.ts", "src/tools/odoo/crm/get-leads.schema.ts"],
    },
    {
      number: 5,
      title: "Advanced Features & Production Deploy",
      duration: "30 min",
      goal: "Add smart features and deploy to production with Docker",
      description:
        "Implement auto-progression (deals advance automatically), email templates, calendar conflict detection, and chatter integration. Then dockerize and deploy to production.",
      steps: [],
      filesCreated: [
        "src/tools/odoo/email/send-email.tool.ts",
        "src/tools/odoo/calendar/schedule-meeting.tool.ts",
        "Dockerfile",
        "docker-compose.yml",
      ],
    },
  ],

  estimatedTime: "2 hours",
  difficulty: "Intermediate",
  prerequisites: [
    "Node.js >= 22.20.0 installed",
    "Basic TypeScript knowledge",
    "An Odoo instance (trial or production)",
    "Redis server (local or cloud)",
    "Claude Desktop app installed",
  ],

  // Architecture
  architectureDescription: `The Odoo MCP connector follows a clean architecture pattern:

**Authentication Layer**: OAuth2 + PKCE with RSA-signed JWT tokens stored in Redis
**Transport Layer**: HTTP/SSE endpoints that implement MCP protocol
**Business Logic**: Odoo client that wraps XML-RPC API calls
**Tools Layer**: Individual MCP tools with Zod schema validation
**Integration Layer**: Smart features like auto-progression and chatter logging

Each tool is self-contained and can be enabled/disabled independently. The connector uses hexagonal architecture principles for maximum testability and maintainability.`,

  technologies: [
    "TypeScript",
    "Express 5",
    "MCP SDK 1.20.0",
    "Redis",
    "Odoo XML-RPC",
    "OAuth2 + PKCE",
    "JWT (RS256)",
    "Zod",
    "Docker",
  ],

  // Social & Links
  publishedAt: "2025-01-18",
  linkedinPost: "https://www.linkedin.com/in/felix-leonobitech",
  githubRepo: "https://github.com/leonobitech/odoo-mcp",
  npmPackage: "@leonobitech/odoo-mcp",
  documentation: "https://github.com/leonobitech/odoo-mcp/tree/main/docs",

  // Stats
  likes: 342,
  comments: 67,

  // SEO
  keywords: [
    "mcp",
    "odoo",
    "crm",
    "oauth2",
    "claude desktop",
    "automation",
    "sales",
    "email",
    "calendar",
    "typescript",
  ],

  useCases: [
    "Automate CRM data entry with natural language",
    "Schedule meetings with automatic conflict detection",
    "Send professional proposals from Claude chat",
    "Track sales pipeline and forecast revenue",
    "Search and manage contacts across your database",
    "Integrate Odoo with AI-powered workflows",
  ],

  targetAudience: [
    "Companies using Odoo CRM",
    "Sales teams looking to automate workflows",
    "Developers building MCP connectors",
    "AI enthusiasts exploring Claude Desktop",
  ],
};
