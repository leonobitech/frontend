// File: app/api/register/route.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";

export async function POST(request: NextRequest) {
  // 1️⃣ Desestructuramos el body
  const { email, password, meta: partialMeta } = await request.json();

  // 2️⃣ Capturamos la IP real desde headers
  const ipAddress = extractServerIp(request);

  // 3️⃣ Reconstruimos el meta completo
  const meta = { ...partialMeta, ipAddress };

  try {
    // 4️⃣ Proxy al backend
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/login`,
      { email, password, meta },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    // 5️⃣ Construimos la respuesta de Next.js y forwardeamos cookies
    const response = NextResponse.json(apiRes.data, { status: apiRes.status });
    const setCookies = apiRes.headers["set-cookie"];
    if (Array.isArray(setCookies)) {
      setCookies.forEach((c) => response.headers.append("Set-Cookie", c));
    } else if (typeof setCookies === "string") {
      response.headers.set("Set-Cookie", setCookies);
    }
    return response;
  } catch (err: unknown) {
    let msg = "Error al iniciar session";
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
