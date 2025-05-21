// File: app/api/login/route.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";
import { verifyTurnstileToken } from "@/utils/security/verifyTurnstileToken";
import { proxyWithCookies } from "@/lib/api/proxyWithCookies";

// 🛡️ Zod schema para validar todo el payload
const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
  turnstileToken: z.string().nonempty("Token de seguridad requerido"),
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

export async function POST(request: NextRequest) {
  // 🧪 1. Parseo y validación
  const body = await request.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Datos de login inválidos",
        issues:
          process.env.NODE_ENV === "development"
            ? parsed.error.flatten()
            : undefined,
      },
      { status: 422 }
    );
  }

  const { email, password, meta: partialMeta, turnstileToken } = parsed.data;

  // 🌐 2. Captura IP real
  const ipAddress = extractServerIp(request);

  // ✅ 3. Verificamos el token Turnstile
  const isValid = await verifyTurnstileToken(turnstileToken);
  if (!isValid) {
    return NextResponse.json(
      { message: "Validación de seguridad fallida. Intenta nuevamente." },
      { status: 400 }
    );
  }

  // 📦 4. Reconstrucción del meta completo
  const meta = { ...partialMeta, ipAddress };

  // Antes del try/catch, después de validar Turnstile
  const accessKey = request.cookies.get("accessKey")?.value;
  const clientKey = request.cookies.get("clientKey")?.value;
  if (accessKey && clientKey) {
    return NextResponse.json(
      { message: "Ya tienes una sesión activa." },
      { status: 400 }
    );
  }

  try {
    // 🚀 5. Proxy limpio al backend real
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/login`,
      { email, password, meta },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY,
        },
        // ❌ No reenviamos cookies ni usamos withCredentials
      }
    );

    // 🍪 6. Forward de Set-Cookie
    return proxyWithCookies(apiRes);
  } catch (err: unknown) {
    let msg = "Error al iniciar sesión";
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
