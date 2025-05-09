// File: app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Validación exacta del objeto `meta`
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
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ipAddress = extractServerIp(request);

    if (process.env.NODE_ENV === "production" && isPrivateIp(ipAddress)) {
      console.warn("🚨 IP privada rechazada:", ipAddress);
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

    const meta = {
      ...parsed.data,
      ipAddress,
      userAgent,
    };

    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/me`,
      { meta },
      {
        headers: {
          Cookie: cookieHeader,
          "X-Request-ID": requestId,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return NextResponse.json(apiRes.data, { status: apiRes.status });
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
      {
        status,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
