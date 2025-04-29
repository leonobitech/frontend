import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardClient />
        </CardContent>
      </Card>
    </div>
  );
}
