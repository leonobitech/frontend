// File: app/api/verify-email/route.ts

import { NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";

export async function POST(request: Request) {
  // 1️⃣ Leemos email, code y el meta parcial del body
  const { email, code, meta: partialMeta } = await request.json();

  // 2️⃣ Extraemos la IP real del cliente
  const ipAddress = extractServerIp(request);

  // 3️⃣ Reconstruimos el meta completo
  const meta = {
    ...partialMeta,
    ipAddress,
  };

  try {
    // 4️⃣ Proxy hacia tu backend, enviando el meta completo
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/verify-email`,
      { email, code, meta },
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
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
    let msg = "Error al verificar el email";
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
