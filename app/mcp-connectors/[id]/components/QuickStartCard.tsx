"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import type { McpConnector } from "@/types/mcp-connector";

interface Props {
  connector: McpConnector;
}

export default function QuickStartCard({ connector }: Props) {
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const handleCopy = async (text: string, setCopied: (value: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="quick-start">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="text-2xl">🚀 Quick Start</CardTitle>
          <CardDescription>
            Get {connector.name} running in Claude Desktop in 2 minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Install */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              Install via npx (no installation required)
            </h3>
            <div className="relative">
              <pre className="bg-black/90 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                <code>{connector.installCommand}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 text-white hover:bg-white/10"
                onClick={() => handleCopy(connector.installCommand, setCopiedInstall)}
              >
                {copiedInstall ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Step 2: Configure */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              Add to Claude Desktop config
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Edit <code className="bg-muted px-1.5 py-0.5 rounded">claude_desktop_config.json</code>:
            </p>
            <div className="relative">
              <pre className="bg-black/90 text-blue-300 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-64">
                <code>{connector.claudeDesktopConfig}</code>
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 text-white hover:bg-white/10"
                onClick={() => handleCopy(connector.claudeDesktopConfig, setCopiedConfig)}
              >
                {copiedConfig ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Step 3: Environment Variables */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              Configure environment variables
            </h3>
            <div className="grid gap-3">
              {connector.envVariables.map((env) => (
                <div
                  key={env.name}
                  className="border border-border rounded-lg p-3 bg-background/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-semibold">
                          {env.name}
                        </code>
                        {env.required && (
                          <span className="text-xs text-red-500 font-medium">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {env.description}
                      </p>
                      {env.example && (
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {env.example}
                        </code>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: Restart */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                4
              </span>
              Restart Claude Desktop
            </h3>
            <p className="text-sm text-muted-foreground">
              Fully quit and restart Claude Desktop. The {connector.name} tools will appear in the{" "}
              <span className="font-semibold">🔨 Tools</span> section.
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              ✅ Done! Try asking Claude: &quot;Show me my latest leads from Odoo&quot;
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
