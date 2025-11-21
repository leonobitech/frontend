export interface BlogPost {
  id: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    avatar?: string;
  };
  coverImage?: string;
  unsplashQuery?: string;
  content?: string; // MDX content path
}

export const blogPosts: BlogPost[] = [
  {
    id: "building-mcp-as-a-service-odoo",
    title: "Building MCP-as-a-Service: From Standalone Server to Multi-Tenant SaaS Platform",
    description:
      "How I transformed a traditional MCP server into a production-ready multi-tenant SaaS platform where users can connect their Odoo CRM to Claude Desktop without any local setup. No npm install, no config files, just register and go. Deep dive into OAuth2, AES-256-GCM encryption, session management, and user isolation.",
    date: "2025-01-19",
    readTime: "40 min read",
    category: "Architecture",
    tags: ["MCP", "Odoo", "Multi-Tenancy", "SaaS", "OAuth2", "TypeScript", "Architecture"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
    unsplashQuery: "saas platform architecture multi tenant security",
    content: "/content/blog/building-mcp-as-a-service-odoo.md",
  },
  {
    id: "why-rust-for-microservices",
    title: "Why Rust for Mission-Critical Microservices?",
    description:
      "Building core-v2: our auth microservice in Rust. Learn why we chose Rust over TypeScript, Go, and Python for production systems. Complete with code examples, benchmarks, and real-world tradeoffs.",
    date: "2024-11-18",
    readTime: "12 min read",
    category: "Rust",
    tags: ["Rust", "Microservices", "Axum", "Performance"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
    unsplashQuery: "rust programming code performance server",
    content: "/content/blog/why-rust-for-microservices.md",
  },
  {
    id: "type-safety-parse-dont-validate",
    title: "Type Safety Extremo: Parse, Don't Validate",
    description:
      "How Rust's type system prevents bugs at compile-time. Implementing Email, Password, and UserId value objects that make illegal states unrepresentable. Real code from core-v2.",
    date: "2024-11-19",
    readTime: "10 min read",
    category: "Rust",
    tags: ["Rust", "Type Safety", "Domain-Driven Design"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
    unsplashQuery: "type safety code structure architecture",
  },
  {
    id: "clean-architecture-rust",
    title: "Clean Architecture in Rust: Beyond the Theory",
    description:
      "Implementing hexagonal architecture with Rust traits. Domain, Application, Infrastructure, and Presentation layers in a real production microservice. No magic, just pure separation of concerns.",
    date: "2024-11-20",
    readTime: "15 min read",
    category: "Architecture",
    tags: ["Architecture", "Rust", "Clean Code", "DDD"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
    unsplashQuery: "hexagonal architecture layers clean code",
  },
  {
    id: "sqlx-compile-time-sql",
    title: "SQLx: Compile-Time Verified SQL Queries",
    description:
      "Why we chose SQLx over traditional ORMs. Compile-time SQL verification against your real database schema. Zero runtime surprises, maximum type safety. Complete with migration strategies and testing patterns.",
    date: "2024-11-21",
    readTime: "14 min read",
    category: "Rust",
    tags: ["SQLx", "Database", "Type Safety", "PostgreSQL"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
    unsplashQuery: "database postgresql sql queries code",
  },
  {
    id: "error-handling-professional",
    title: "Professional Error Handling in Rust",
    description:
      "Building a robust error hierarchy with thiserror. Domain errors, application errors, and API errors. Error propagation patterns and how to make debugging in production actually pleasant.",
    date: "2024-11-22",
    readTime: "11 min read",
    category: "Rust",
    tags: ["Error Handling", "Rust", "Best Practices"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
    unsplashQuery: "error handling debugging code production",
  },
  {
    id: "n8n-scalable-architecture",
    title: "n8n Scalable Architecture with Load Balancing",
    description:
      "Building a highly scalable n8n architecture with Redis, load balancing, and queue workers. Production-ready workflow automation that handles thousands of executions per minute.",
    date: "2024-03-04",
    readTime: "8 min read",
    category: "Architecture",
    tags: ["n8n", "Redis", "Load Balancing", "Automation"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
    unsplashQuery: "workflow automation n8n architecture redis",
  },
  {
    id: "n8n-scalable-architecture-traefik",
    title: "Building a Production-Grade n8n Architecture with Traefik Load Balancing & Queue Management",
    description:
      "From a single n8n container to a horizontally-scaled architecture with dedicated webhook workers, parallel execution nodes, and Traefik-managed load balancing. Learn how to handle thousands of workflows without blocking your UI using Docker Compose, Redis queue, PostgreSQL, and ForwardAuth integration.",
    date: "2025-01-21",
    readTime: "35 min read",
    category: "Architecture",
    tags: ["n8n", "Docker", "Traefik", "Load Balancing", "Redis", "PostgreSQL", "Architecture"],
    author: {
      name: "Felix @ Leonobitech",
      avatar: "/avatar.png",
    },
    unsplashQuery: "distributed architecture load balancing docker containers",
    content: "/content/blog/n8n-scalable-architecture-traefik.md",
  },
];

export function findBlogPostById(id: string): BlogPost | undefined {
  return blogPosts.find((post) => post.id === id);
}

export function getFeaturedPost(): BlogPost {
  return blogPosts[0];
}

export function getLatestPosts(excludeId?: string): BlogPost[] {
  return blogPosts
    .filter((post) => post.id !== excludeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
