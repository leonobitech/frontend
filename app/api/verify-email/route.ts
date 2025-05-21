// File: app/api/verify-email/route.ts

import { NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";
import { proxyWithCookies } from "@/lib/api/proxyWithCookies";

// 🛡️ 1. Zod schema para validar el body completo
const VerifyEmailSchema = z.object({
  email: z.string().email("Email inválido"),
  code: z.string().length(6, "El código debe tener 6 dígitos"),
  requestId: z.string(),
  meta: z.object({
    deviceInfo: z.object({
      device: z.string(),
      os: z.string(),
      browser: z.string(),
    }),
    userAgent: z.string(),
    language: z.string(),
    platform: z.string(),
    timezone: z.string(),
    screenResolution: z.string(),
    label: z.string(),
  }),
});

export async function POST(request: Request) {
  // 🧪 2. Parseo y validación
  const body = await request.json();
  const parsed = VerifyEmailSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Datos inválidos",
        issues:
          process.env.NODE_ENV === "development"
            ? parsed.error.flatten()
            : undefined,
      },
      { status: 422 }
    );
  }

  const { email, code, requestId, meta: partialMeta } = parsed.data;

  // 🌐 3. Captura de IP real
  const ipAddress = extractServerIp(request);

  // 📦 4. Meta completo con IP
  const meta = { ...partialMeta, ipAddress };

  try {
    // 🚀 5. Proxy al backend real
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/verify-email`,
      { email, code, requestId, meta },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY,
        },
        // ❌ No withCredentials
      }
    );

    // 🍪 6. Forward de Set-Cookie
    return proxyWithCookies(apiRes);
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
