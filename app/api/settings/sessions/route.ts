import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

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
 * GET /api/settings/sessions
 * Get all active sessions for the current user
 */
export async function GET(request: NextRequest) {
  try {
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
    const response = await axios.get<BackendResponse>(
      `${process.env.BACKEND_URL}/account/sessions`,
      {
        headers: {
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
