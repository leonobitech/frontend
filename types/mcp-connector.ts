/**
 * Type definitions for MCP Connectors
 * Used in the MCP Gallery to showcase and teach connector development
 */

export type ConnectorDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type ConnectorCategory =
  | "CRM"
  | "Productivity"
  | "Database"
  | "Communication"
  | "Marketing"
  | "E-commerce"
  | "Finance"
  | "Automation";

/**
 * Information about an MCP tool
 */
export interface ToolInfo {
  name: string;
  description: string;
  category: string;
  inputSchema?: Record<string, unknown>;
  example: string;
  exampleOutput?: string;
}

/**
 * Information about an MCP resource
 */
export interface ResourceInfo {
  name: string;
  description: string;
  uri: string;
  mimeType?: string;
}

/**
 * Information about an MCP prompt
 */
export interface PromptInfo {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

/**
 * Code snippet with syntax highlighting
 */
export interface CodeSnippet {
  filename: string;
  language: string;
  code: string;
  explanation: string;
  highlights?: number[]; // Line numbers to highlight
}

/**
 * Individual step in a build phase
 */
export interface BuildStep {
  title: string;
  description: string;
  codeSnippets: CodeSnippet[];
  checkpoints: string[]; // What should work after this step
}

/**
 * Build phase for tutorial
 */
export interface BuildPhase {
  number: number;
  title: string;
  duration: string; // e.g., "15 min"
  goal: string;
  description: string;
  steps: BuildStep[];
  filesCreated: string[];
}

/**
 * Environment variable required for the connector
 */
export interface EnvVariable {
  name: string;
  description: string;
  required: boolean;
  example?: string;
  default?: string;
}

/**
 * Complete MCP Connector definition
 */
export interface McpConnector {
  // Basic metadata
  id: string;
  name: string;
  tagline: string;
  description: string;

  // Visual assets
  logo?: string;
  coverImage?: string;
  demoVideo?: string; // LinkedIn post URL or YouTube
  screenshots?: string[];

  // Technical details
  category: ConnectorCategory;
  targetPlatform: string; // "Odoo", "Salesforce", "Notion", etc.
  sdk: string;
  version: string;
  nodeVersion?: string;

  // Features
  tools: ToolInfo[];
  resources?: ResourceInfo[];
  prompts?: PromptInfo[];
  features: string[]; // High-level features

  // Installation & Setup
  installCommand: string;
  envVariables: EnvVariable[];
  claudeDesktopConfig: string; // JSON config for claude_desktop_config.json

  // Tutorial content
  buildPhases: BuildPhase[];
  estimatedTime: string; // Total time, e.g., "90 minutes"
  difficulty: ConnectorDifficulty;
  prerequisites: string[];

  // Architecture
  architectureDescription: string;
  architectureDiagram?: string;
  technologies: string[];

  // Social proof & links
  publishedAt: string;
  linkedinPost?: string;
  githubRepo?: string;
  npmPackage?: string;
  documentation?: string;

  // Stats (optional)
  stars?: number;
  downloads?: number;
  likes?: number;
  comments?: number;

  // SEO & discovery
  keywords: string[];
  useCases: string[];
  targetAudience: string[];
}

/**
 * Connector gallery metadata (lighter version for listings)
 */
export interface ConnectorCardData {
  id: string;
  name: string;
  tagline: string;
  category: ConnectorCategory;
  targetPlatform: string;
  coverImage?: string;
  toolCount: number;
  difficulty: ConnectorDifficulty;
  estimatedTime: string;
  publishedAt: string;
  likes?: number;
  githubRepo?: string;
}
