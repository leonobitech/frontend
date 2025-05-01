// File: app/api/account/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const { meta } = await request.json();

    // Agregar IP al meta
    const ipAddress = extractServerIp(request);
    meta.ipAddress = ipAddress;

    // 🔍 DEBUG COMPLETO
    console.log("🍪 Cookie:", cookieHeader);
    console.log("🧬 Meta:", meta);

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

    // 🔁 Forwardear cookies nuevas al cliente
    const response = NextResponse.json(apiRes.data, {
      status: apiRes.status,
    });

    const setCookies = apiRes.headers["set-cookie"];
    if (Array.isArray(setCookies)) {
      setCookies.forEach((c) => response.headers.append("Set-Cookie", c));
    } else if (typeof setCookies === "string") {
      response.headers.set("Set-Cookie", setCookies);
    }

    return response;
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
