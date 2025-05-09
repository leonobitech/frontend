// File: app/api/auth/session/route.ts

import { NextResponse } from "next/server";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// -----------------------------------------------------------------------------
// 🧪 Zod Schema – Validación estricta del payload `meta`
// Este objeto es construido por el cliente e incluye info del dispositivo.
// Se usa para trazabilidad, detección de fraudes, y generación de fingerprint.
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// 🔐 Función auxiliar – Detecta si una IP pertenece a un rango privado
// Se usa para bloquear solicitudes no autorizadas en producción real.
// -----------------------------------------------------------------------------
function isPrivateIp(ip?: string): boolean {
  if (!ip) return true;
  return (
    ip.startsWith("127.") || // loopback IPv4
    ip.startsWith("10.") || // red privada clase A
    ip.startsWith("192.168.") || // red privada clase C
    ip.startsWith("172.16.") || // red privada clase B (rango parcial)
    ip === "::1" || // loopback IPv6
    ip === "localhost"
  );
}

export async function POST(request: Request) {
  const isProd = process.env.NODE_ENV === "production";

  try {
    // 🧾 Extracción de headers relevantes
    const cookieHeader = request.headers.get("cookie") || "";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ipAddress = extractServerIp(request); // <- normaliza y obtiene la IP real

    // 🛡️ Protección activa: bloqueo de IPs privadas solo en producción
    // Impide accesos desde entornos locales o spoofing dentro de red interna.
    if (isProd && isPrivateIp(ipAddress) && !ipAddress.startsWith("192.168.")) {
      console.warn("🚨 IP privada rechazada:", ipAddress);
      return NextResponse.json(
        { message: "Solicitud rechazada por IP privada" },
        { status: 403 }
      );
    }

    // 📦 Parseo del body y validación del objeto `meta`
    const body = await request.json();
    const parsed = MetaSchema.safeParse(body.meta);

    if (!parsed.success) {
      // 🔎 En modo dev, se devuelven los errores detallados de validación
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

    // 🆔 Generación de ID único para trazabilidad de la request
    const requestId = uuidv4();

    // 📌 Payload enriquecido con IP y User-Agent reales (servidor)
    const meta = {
      ...parsed.data,
      ipAddress,
      userAgent,
    };

    // 🔁 Forward del request al backend real (auth service o core)
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

    // ✅ Respuesta del backend propagada al frontend
    return NextResponse.json(apiRes.data, { status: apiRes.status });
  } catch (err: unknown) {
    // ❌ Manejo de errores
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
            ? msg // 🐞 Detalles completos en dev
            : "No se pudo cargar la sesión", // 🔒 Mensaje genérico en prod
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store", // ⚠️ Evita cachear errores
        },
      }
    );
  }
}
