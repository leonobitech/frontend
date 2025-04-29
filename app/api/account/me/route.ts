// File: app/api/refresh-token/route.ts

import { NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { buildClientMeta } from "@/lib/clientMeta";

export async function POST(request: Request) {
  try {
    // 1️⃣ Leemos cookies manualmente
    const cookieHeader = request.headers.get("cookie") || "";

    // 2️⃣ Leemos valores dinámicos desde el body
    const { screenResolution } = await request.json();

    // 3️⃣ Meta parcial y extracción IP
    const ipAddress = extractServerIp(request);
    const partialMeta = buildClientMeta();
    const meta = { ...partialMeta, ipAddress, screenResolution };

    // 4️⃣ Enviamos al backend
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/refresh-token`,
      { meta },
      {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    // 5️⃣ Forward de respuesta + cookies nuevas si hay
    const response = NextResponse.json(apiRes.data, { status: apiRes.status });
    const setCookies = apiRes.headers["set-cookie"];
    if (Array.isArray(setCookies)) {
      setCookies.forEach((c) => response.headers.append("Set-Cookie", c));
    } else if (typeof setCookies === "string") {
      response.headers.set("Set-Cookie", setCookies);
    }

    return response;
  } catch (err: unknown) {
    let msg = "Error al refrescar token";
    let status = 500;
    if (axios.isAxiosError(err) && err.response) {
      status = err.response.status;
      msg = err.response.data?.message || err.response.statusText;
    } else if (err instanceof Error) {
      msg = err.message;
    }
    return NextResponse.json({ message: msg }, { status });
  }
}
