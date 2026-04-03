"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, BookOpen } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg min-h-screen">
      <Card>
        <CardContent className="py-12 text-center space-y-6">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Inscripción exitosa
            </h1>
            <p className="text-muted-foreground">
              Tu pago fue procesado correctamente. Ya tienes acceso al curso.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg">
              <Link href={`/courses/${slug}`}>
                <BookOpen className="h-4 w-4 mr-2" />
                Ver el curso
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/courses">
                Ver más cursos
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
