// app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { proxyWithCookies } from "@/lib/api/proxyWithCookies";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// ✅ Validación estricta del meta recibido
const MetaSchema = z.object({
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
});

// 🔐 Detección de IP privada
function isPrivateIp(ip?: string): boolean {
  if (!ip) return true;
  return (
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip === "::1" ||
    ip === "localhost"
  );
}

// 🔧 Helper: JSON + no-store + vary tipado
function jsonNoStore<T>(body: T, status: number) {
  const r = NextResponse.json<T>(body, { status });
  r.headers.set("Cache-Control", "no-store");
  r.headers.set("Vary", "Cookie, Authorization");
  return r;
}

export async function POST(request: Request) {
  const isProd = process.env.NODE_ENV === "production";

  try {
    const allowedCookies = [
      "accessKey",
      "clientKey",
      "clientMeta",
      "sidebar_state",
    ];

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookiesToSend: string[] = [];

    // ✅ limpiar cookies no permitidas
    for (const { name, value } of allCookies) {
      if (allowedCookies.includes(name)) {
        cookiesToSend.push(`${name}=${value}`);
      } else {
        cookieStore.delete(name);
        console.warn("🔥 SSR Cookie purgada:", name);
      }
    }

    const filteredCookieHeader = cookiesToSend.join("; ");
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ipAddress = extractServerIp(request);

    // ⛔ Bloqueo de IP privadas en producción
    if (isProd && isPrivateIp(ipAddress) && !ipAddress.startsWith("192.168.")) {
      return jsonNoStore(
        { message: "Solicitud rechazada por IP privada" },
        403
      );
    }

    const body = await request.json();
    const parsed = MetaSchema.safeParse(body.meta);

    if (!parsed.success) {
      return jsonNoStore(
        {
          message: "Meta inválido",
          issues:
            process.env.NODE_ENV === "development"
              ? parsed.error.flatten()
              : undefined,
        },
        422
      );
    }

    // 🆔 IDs para trazabilidad
    const requestId = uuidv4();
    const idemKey = `${requestId}:${Date.now()}`;

    const meta = { ...parsed.data, ipAddress, userAgent };

    // 📡 Proxy al backend real
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/me`,
      { meta },
      {
        headers: {
          Cookie: filteredCookieHeader,
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY,
        },
        withCredentials: true,
      }
    );

    return proxyWithCookies(apiRes);
  } catch (err: unknown) {
    const isAxios = axios.isAxiosError(err);
    const status = isAxios && err.response ? err.response.status : 500;

    // 🔓 401/403 = usuario no autenticado, devolver 200 con null (no es un error)
    if (status === 401 || status === 403) {
      return jsonNoStore({ user: null, session: null }, 200);
    }

    const msg =
      isAxios && err.response
        ? err.response.data?.message || err.response.statusText
        : err instanceof Error
        ? err.message
        : "Error desconocido";

    return jsonNoStore(
      {
        message:
          process.env.NODE_ENV === "development"
            ? msg
            : "No se pudo cargar la sesión",
      },
      status
    );
  }
}
