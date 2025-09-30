// app/api/login/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";
import { verifyTurnstileToken } from "@/utils/security/verifyTurnstileToken";
import {
  proxyWithCookies /*, proxyWithCookiesAllowlist*/,
} from "@/lib/api/proxyWithCookies";
import { v4 as uuidv4 } from "uuid";

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

function jsonNoStore<T>(body: T, status: number) {
  const r = NextResponse.json<T>(body, { status });
  r.headers.set("Cache-Control", "no-store");
  r.headers.set("Vary", "Cookie, Authorization");
  return r;
}

export async function POST(request: NextRequest) {
  // 1) Parseo y validación
  const body = await request.json();
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore(
      {
        message: "Datos de login inválidos",
        issues:
          process.env.NODE_ENV === "development"
            ? parsed.error.flatten()
            : undefined,
      },
      422
    );
  }

  const { email, password, meta: partialMeta, turnstileToken } = parsed.data;

  // 2) Captura IP real
  const ipAddress = extractServerIp(request);

  // 3) Verificamos Turnstile
  const isValid = await verifyTurnstileToken(turnstileToken);
  if (!isValid) {
    return jsonNoStore(
      { message: "Validación de seguridad fallida. Intenta nuevamente." },
      400
    );
  }

  // 4) Si ya hay sesión, corta temprano (opcional: devolver 200/409)
  const accessKey = request.cookies.get("accessKey")?.value;
  const clientKey = request.cookies.get("clientKey")?.value;
  if (accessKey && clientKey) {
    return jsonNoStore({ message: "Ya tienes una sesión activa." }, 400);
  }

  // 5) Meta completo
  const meta = { ...partialMeta, ipAddress };

  // 6) Trazabilidad
  const requestId = request.headers.get("X-Request-ID") ?? uuidv4();
  const idemKey = request.headers.get("Idempotency-Key") ?? requestId;

  try {
    // 7) Proxy al backend
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/login`,
      { email, password, meta },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY,
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
          "Cache-Control": "no-store",
        },
        // sin cookies ni withCredentials
        validateStatus: () => true,
        timeout: 15000,
      }
    );

    // 8) Forward de cookies + no-store + vary
    // return proxyWithCookiesAllowlist(apiRes, ["accessKey", "clientKey"]);
    return proxyWithCookies(apiRes);
  } catch (err: unknown) {
    const status =
      axios.isAxiosError(err) && err.response ? err.response.status : 500;
    const message =
      axios.isAxiosError(err) && err.response
        ? err.response.data?.message || err.response.statusText
        : err instanceof Error
        ? err.message
        : "Error al iniciar sesión";
    return jsonNoStore({ message }, status);
  }
}
