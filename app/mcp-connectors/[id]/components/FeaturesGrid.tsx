import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface Props {
  features: string[];
}

export default function FeaturesGrid({ features }: Props) {
  return (
    <section id="features">
      <h2 className="text-3xl font-bold mb-8">✨ Key Features</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature, index) => (
          <Card key={index} className="border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{feature}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
