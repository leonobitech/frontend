// File: app/api/register/route.ts

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";
import { verifyTurnstileToken } from "@/utils/security/verifyTurnstileToken";

// 🛡️ 1. Zod schema para validar body completo
const RegisterSchema = z
  .object({
    email: z
      .string()
      .nonempty("El email es obligatorio")
      .email("Formato de email inválido"),
    password: z
      .string()
      .nonempty("La contraseña es obligatoria")
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
      .regex(/[a-z]/, "Debe tener al menos una minúscula")
      .regex(/\d/, "Debe tener al menos un número")
      .regex(/[\W_]/, "Debe tener un carácter especial"),
    confirmPassword: z.string().nonempty("Confirma tu contraseña"),
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
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export async function POST(request: NextRequest) {
  // 🧪 2. Parseo y validación del payload
  const body = await request.json();
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Datos de registro inválidos",
        issues:
          process.env.NODE_ENV === "development"
            ? parsed.error.flatten()
            : undefined,
      },
      { status: 422 }
    );
  }

  const {
    email,
    password,
    confirmPassword,
    meta: partialMeta,
    turnstileToken,
  } = parsed.data;

  // 🌐 3. Captura IP real del cliente
  const ipAddress = extractServerIp(request);

  // 🛡️ 4. Validación Turnstile
  const isValid = await verifyTurnstileToken(turnstileToken);
  if (!isValid) {
    return NextResponse.json(
      { message: "Validación de seguridad fallida. Intenta nuevamente." },
      { status: 400 }
    );
  }

  // 📦 5. Reconstrucción del meta completo
  const meta = { ...partialMeta, ipAddress };

  try {
    // 🚀 6. Proxy limpio al backend real
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/register`,
      { email, password, confirmPassword, meta },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY,
        },
        // ❌ No reenviamos cookies ni usamos withCredentials
      }
    );

    return NextResponse.json(apiRes.data, { status: apiRes.status });
  } catch (error: unknown) {
    // 🧯 7. Manejo de errores
    let statusCode = 500;
    let message = "Error al crear la cuenta";

    if (axios.isAxiosError(error)) {
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
