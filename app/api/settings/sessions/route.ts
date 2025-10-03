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

interface BackendSession {
  id: string;
  device: unknown;
  isRevoked: boolean;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

interface BackendResponse {
  sessions?: BackendSession[];
  message?: string;
}

/**
 * POST /api/settings/sessions
 * Get all active sessions for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meta: clientMeta } = body;

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
    const requestId = uuidv4();
    const idemKey = `${requestId}:${Date.now()}`;

    // Conectar con backend usando axios
    const response = await axios.post<BackendResponse>(
      `${process.env.BACKEND_URL}/account/sessions`,
      { meta },
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: filteredCookieHeader,
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
          "x-core-access-key": process.env.CORE_API_KEY || "",
        },
        withCredentials: true,
      }
    );

    const data = response.data;

    // Mapear las sesiones al formato esperado por el frontend
    const sessions = data.sessions?.map((session) => ({
      id: session.id,
      device: session.device,
      isRevoked: session.isRevoked,
      isCurrent: session.isCurrent,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
    })) || [];

    const result = NextResponse.json(sessions);
    result.headers.set("Cache-Control", "no-store");
    result.headers.set("Vary", "Cookie, Authorization");
    return result;
  } catch (error) {
    console.error("[Sessions Fetch Error]", error);

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
