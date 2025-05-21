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

export async function POST(request: Request) {
  const isProd = process.env.NODE_ENV === "production";

  try {
    const allowedCookies = ["accessKey", "clientKey"];
    const cookieStore = cookies();
    const allCookies = (await cookieStore).getAll();

    const cookiesToSend: string[] = [];

    allCookies.forEach(async ({ name, value }) => {
      if (allowedCookies.includes(name)) {
        cookiesToSend.push(`${name}=${value}`);
      } else {
        (await cookieStore).delete(name);
        console.warn("🔥 SSR Cookie purgada:", name);
      }
    });

    const filteredCookieHeader = cookiesToSend.join("; ");
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ipAddress = extractServerIp(request);

    // ⛔ Bloqueo de IP privadas en producción
    if (isProd && isPrivateIp(ipAddress) && !ipAddress.startsWith("192.168.")) {
      return NextResponse.json(
        { message: "Solicitud rechazada por IP privada" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = MetaSchema.safeParse(body.meta);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Meta inválido",
          issues:
            process.env.NODE_ENV === "development"
              ? parsed.error.flatten()
              : undefined,
        },
        { status: 422 }
      );
    }

    const requestId = uuidv4();
    const meta = { ...parsed.data, ipAddress, userAgent };

    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/me`,
      { meta },
      {
        headers: {
          Cookie: filteredCookieHeader,
          "X-Request-ID": requestId,
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
    const msg =
      isAxios && err.response
        ? err.response.data?.message || err.response.statusText
        : err instanceof Error
        ? err.message
        : "Error desconocido";

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development"
            ? msg
            : "No se pudo cargar la sesión",
      },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}
