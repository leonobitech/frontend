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

    return NextResponse.json(apiRes.data, { status: apiRes.status });
  } catch (error: unknown) {
    // 👇 Manejamos el error como unknown y luego lo estrechamos
    let statusCode = 500;
    let message = "Error al iniciar session";

    if (axios.isAxiosError(error)) {
      // AxiosError tiene response opcional
      statusCode = error.response?.status ?? statusCode;
      message =
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : error.response?.statusText ?? message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return NextResponse.json({ message }, { status: statusCode });
  }
}
