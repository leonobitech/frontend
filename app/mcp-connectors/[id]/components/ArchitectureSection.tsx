import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";

interface Props {
  description: string;
  technologies: string[];
}

export default function ArchitectureSection({ description, technologies }: Props) {
  return (
    <section id="architecture">
      <h2 className="text-3xl font-bold mb-8">🏗️ Architecture</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            System Design
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {description.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-sm text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Technologies */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech, index) => (
                <Badge key={index} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
