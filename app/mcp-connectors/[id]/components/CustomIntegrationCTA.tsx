import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Sparkles } from "lucide-react";

export default function CustomIntegrationCTA() {
  return (
    <section id="custom-integration">
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />

        <CardContent className="p-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold">
              Need a Custom MCP Connector?
            </h3>
            <p className="text-lg text-muted-foreground">
              I build production-ready MCP connectors for businesses.
              Whether it&apos;s Salesforce, custom APIs, or enterprise systems - let&apos;s make it work with Claude.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="mailto:felix@leonobitech.com">
                <MessageCircle className="mr-2 h-5 w-5" />
                Let&apos;s Talk
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/contact">
                View More Connectors
              </Link>
            </Button>
          </div>

          <div className="pt-6 border-t border-border/50 mt-8">
            <p className="text-sm text-muted-foreground">
              🚀 30-day delivery • 💰 Fixed pricing • ✅ Production support included
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
