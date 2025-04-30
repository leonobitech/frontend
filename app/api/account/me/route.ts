// File: app/api/account/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { buildClientMeta } from "@/lib/clientMeta";

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Extraer cookies del request
    const cookieHeader = request.headers.get("cookie") || "";

    // 2️⃣ Extraer resolución de pantalla del body
    const body = await request.json();
    const screenResolution = body.screenResolution || "";

    // 3️⃣ Generar metadata del cliente
    const ipAddress = extractServerIp(request);
    const partialMeta = buildClientMeta();
    const meta = { ...partialMeta, ipAddress, screenResolution };

    // 🔍 DEBUG COMPLETO
    console.log("📦 meta recibido en API Route /api/account/me:");
    console.log(JSON.stringify(meta, null, 2));
    console.log("🍪 cookie header:", cookieHeader);
    console.log("🌍 BACKEND_URL:", process.env.BACKEND_URL);

    // 4️⃣ Enviar petición al backend con cookies y meta
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/me`,
      { meta },
      {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return NextResponse.json(apiRes.data, { status: apiRes.status });
  } catch (err: unknown) {
    console.error("❌ Error en /api/account/me:", err);
    let msg = "Error al cargar datos del usuario";
    let status = 500;

    if (axios.isAxiosError(err) && err.response) {
      status = err.response.status;
      msg = err.response.data?.message || err.response.statusText;
    } else if (err instanceof Error) {
      msg = err.message;
    }

    return NextResponse.json(
      { message: msg },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
