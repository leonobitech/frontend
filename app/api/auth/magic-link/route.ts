// app/api/auth/magic-link/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { verifyTurnstileToken } from "@/utils/security/verifyTurnstileToken";
import { v4 as uuidv4 } from "uuid";

const MagicLinkSchema = z.object({
  email: z.string().email("Email inválido"),
  turnstileToken: z.string().nonempty("Token de seguridad requerido"),
});

function jsonNoStore<T>(body: T, status: number) {
  const r = NextResponse.json<T>(body, { status });
  r.headers.set("Cache-Control", "no-store");
  r.headers.set("Vary", "Cookie, Authorization");
  return r;
}

export async function POST(request: NextRequest) {
  // 1) Parseo y validación
  const body = await request.json();
  const parsed = MagicLinkSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore(
      {
        message: "Datos inválidos",
        issues:
          process.env.NODE_ENV === "development"
            ? parsed.error.flatten()
            : undefined,
      },
      422
    );
  }

  const { email, turnstileToken } = parsed.data;

  // 2) Verificamos Turnstile
  const isValid = await verifyTurnstileToken(turnstileToken);
  if (!isValid) {
    return jsonNoStore(
      { message: "Validación de seguridad fallida. Intenta nuevamente." },
      400
    );
  }

  // 3) Si ya hay sesión activa, corta
  const accessKey = request.cookies.get("accessKey")?.value;
  const clientKey = request.cookies.get("clientKey")?.value;
  if (accessKey && clientKey) {
    return jsonNoStore({ message: "Ya tienes una sesión activa." }, 400);
  }

  // 4) Trazabilidad
  const requestId = request.headers.get("X-Request-ID") ?? uuidv4();

  try {
    // 5) Proxy al backend
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/auth/magic-link`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY,
          "X-Request-ID": requestId,
          "Cache-Control": "no-store",
        },
        validateStatus: () => true,
        timeout: 15000,
      }
    );

    return jsonNoStore(apiRes.data, apiRes.status);
  } catch (err: unknown) {
    const status =
      axios.isAxiosError(err) && err.response ? err.response.status : 500;
    const message =
      axios.isAxiosError(err) && err.response
        ? err.response.data?.message || err.response.statusText
        : err instanceof Error
        ? err.message
        : "Error al enviar magic link";
    return jsonNoStore({ message }, status);
  }
}
