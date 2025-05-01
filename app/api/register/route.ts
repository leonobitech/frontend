// File: app/api/register/route.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { verifyTurnstileToken } from "@/utils/security/verifyTurnstileToken";

export async function POST(request: NextRequest) {
  // 1️⃣ Desestructuramos el body
  const {
    email,
    password,
    confirmPassword,
    meta: partialMeta,
    turnstileToken,
  } = await request.json();

  // 2️⃣ Capturamos la IP real desde headers
  const ipAddress = extractServerIp(request);

  // 2️⃣ Validación del token Turnstile
  const isValid = await verifyTurnstileToken(turnstileToken);
  if (!isValid) {
    return NextResponse.json(
      { message: "Validación de seguridad fallida. Intenta nuevamente." },
      { status: 400 }
    );
  }

  // 3️⃣ Reconstruimos el meta completo
  const meta = { ...partialMeta, ipAddress };

  try {
    // 4️⃣ Proxy al backend
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/register`,
      { email, password, confirmPassword, meta },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );

    return NextResponse.json(apiRes.data, { status: apiRes.status });
  } catch (error: unknown) {
    // 👇 Manejamos el error como unknown y luego lo estrechamos
    let statusCode = 500;
    let message = "Error al crear la cuenta";

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
