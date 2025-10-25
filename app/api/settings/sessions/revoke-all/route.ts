import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";
import type { ClientMeta } from "@/types/meta";

// ===== Schema =====
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

/**
 * POST /api/settings/sessions/revoke-all
 * Revoke all sessions except the current one
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meta: clientMeta } = body;

    // Extraer headers de trazabilidad del cliente
    const clientRequestId = request.headers.get("X-Request-ID") || uuidv4();
    const clientIdemKey = request.headers.get("Idempotency-Key") || `${clientRequestId}:${Date.now()}`;

    // Capturar IP del servidor y construir meta completo
    const ipAddress = extractServerIp(request);
    const parsed = MetaSchema.safeParse(clientMeta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }
    const meta: ClientMeta = { ...parsed.data, ipAddress };

    const allowedCookies = ["accessKey", "clientKey", "clientMeta"];

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookiesToSend: string[] = [];

    for (const { name, value } of allCookies) {
      if (allowedCookies.includes(name)) {
        cookiesToSend.push(`${name}=${value}`);
      }
    }

    const filteredCookieHeader = cookiesToSend.join("; ");

    // Conectar con backend usando axios
    // IMPORTANT: Use meta.userAgent (from browser) instead of server's User-Agent
    const response = await axios.delete(
      `${process.env.BACKEND_URL}/account/sessions/all`,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: filteredCookieHeader,
          "X-Request-ID": clientRequestId,
          "Idempotency-Key": clientIdemKey,
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "User-Agent": meta.userAgent, // Use client's User-Agent, not server's
        },
        data: { meta },
        withCredentials: true,
      }
    );

    const result = NextResponse.json({
      message: response.data.message || "All other sessions revoked successfully",
      revokedCount: response.data.deletedCount || 0,
    });
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    console.error("[Revoke All Sessions Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message = isAxios && error.response
      ? error.response.data?.message || error.response.statusText
      : "Internal server error";

    const result = NextResponse.json({ message }, { status });
    result.headers.set("Cache-Control", "no-store");
    return result;
  }
}
