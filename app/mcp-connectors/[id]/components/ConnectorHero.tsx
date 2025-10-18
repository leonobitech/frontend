import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink, Download, Star } from "lucide-react";
import type { McpConnector } from "@/types/mcp-connector";

interface Props {
  connector: McpConnector;
}

export default function ConnectorHero({ connector }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {connector.category}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {connector.difficulty}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {connector.estimatedTime}
              </Badge>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {connector.name}
              </h1>
              <p className="text-xl text-muted-foreground">
                {connector.tagline}
              </p>
            </div>

            {/* Description */}
            <p className="text-base text-muted-foreground leading-relaxed">
              {connector.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span>{connector.likes || 0} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>{connector.tools.length} tools</span>
              </div>
              <div>
                <span>v{connector.version}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              {connector.githubRepo && (
                <Button asChild size="lg">
                  <Link href={connector.githubRepo} target="_blank" rel="noreferrer">
                    <Github className="mr-2 h-5 w-5" />
                    View on GitHub
                  </Link>
                </Button>
              )}

              {connector.linkedinPost && (
                <Button asChild size="lg" variant="outline">
                  <Link href={connector.linkedinPost} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Link>
                </Button>
              )}

              {connector.npmPackage && (
                <Button asChild size="lg" variant="outline">
                  <Link href={`https://www.npmjs.com/package/${connector.npmPackage}`} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-5 w-5" />
                    npm Package
                  </Link>
                </Button>
              )}
            </div>

            {/* Technologies */}
            <div className="pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Built with
              </p>
              <div className="flex flex-wrap gap-2">
                {connector.technologies.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Cover Image / Demo */}
          <div className="relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-muted/40 shadow-2xl">
              {connector.coverImage ? (
                <Image
                  src={connector.coverImage}
                  alt={connector.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-lg">{connector.targetPlatform} Integration</p>
                </div>
              )}
            </div>

            {/* Floating stats card */}
            <div className="absolute -bottom-6 left-6 right-6 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {connector.tools.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Tools</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {connector.buildPhases.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Phases</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {connector.estimatedTime}
                  </p>
                  <p className="text-xs text-muted-foreground">Build Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
