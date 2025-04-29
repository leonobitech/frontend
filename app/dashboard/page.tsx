// File: app/dashboard/page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  // 1️⃣ Leer ambas cookies de autenticación
  const accessKey = cookies().get("accessKey")?.value;
  const clientKey = cookies().get("clientKey")?.value;
  if (!accessKey || !clientKey) {
    // Si falta alguna, redirigir a login
    redirect("/login");
  }

  // 2️⃣ Construir header de cookies para enviarlas a tu API externa
  const cookieHeader = [
    `accessKey=${accessKey}`,
    `clientKey=${clientKey}`,
  ].join("; ");

  // 3️⃣ Fetch server→server al endpoint /account/me incluyendo cookies y auth
  const res = await fetch(`${process.env.BACKEND_URL}/account/me`, {
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // Token inválido o expirado
    redirect("/login");
  }

  const user = await res.json();

  // 4️⃣ Renderizar dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome, {user.email}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">This is your dashboard.</p>
          <Button
            onClick={() => console.log("Action triggered")}
            className="mt-4"
          >
            Do Something
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
