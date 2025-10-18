import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Play } from "lucide-react";
import type { ToolInfo } from "@/types/mcp-connector";

interface Props {
  tools: ToolInfo[];
}

export default function ToolsShowcase({ tools }: Props) {
  return (
    <section id="tools">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">🛠️ Available Tools</h2>
        <p className="text-muted-foreground">
          {tools.length} powerful tools ready to use in Claude Desktop
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-primary" />
                    {tool.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {tool.description}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {tool.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Example Usage */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Play className="h-3 w-3" />
                  Example Usage
                </p>
                <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto">
                  <code className="text-foreground whitespace-pre-wrap">
                    {tool.example}
                  </code>
                </pre>
              </div>

              {/* Example Output */}
              {tool.exampleOutput && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Returns
                  </p>
                  <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {tool.exampleOutput}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
