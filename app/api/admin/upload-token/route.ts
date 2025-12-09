// app/api/admin/upload-token/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";

// ===== Config =====
const CORE_PATH = "/admin/upload-token";
const FORWARD_COOKIES = ["accessKey", "clientKey"] as const;

// ===== Tipos utilitarios =====
type CookiePair = { name: string; value: string };
type CookieStore = { getAll(): CookiePair[] };

async function getCookieStore(): Promise<CookieStore> {
  const maybe = cookies() as unknown;
  if (maybe && typeof (maybe as Promise<CookieStore>).then === "function") {
    return (await (maybe as Promise<CookieStore>)) as CookieStore;
  }
  return maybe as CookieStore;
}

function buildCookieHeaderFromPairs(
  pairs: CookiePair[],
  names: readonly string[]
): string | undefined {
  const selected = pairs
    .filter((c) => (names as readonly string[]).includes(c.name))
    .map((c) => `${c.name}=${c.value}`);
  return selected.length ? selected.join("; ") : undefined;
}

/**
 * POST /api/admin/upload-token
 *
 * Proxy to Core to get an upload token for direct uploads.
 * This avoids exposing the x-core-access-key to the browser.
 *
 * Body: { action: "upload-podcast" }
 * Returns: { success: true, token: string, expiresIn: number }
 */
export async function POST(request: Request) {
  try {
    // 1) Auth cookies (fail-fast si faltan)
    const store = await getCookieStore();
    const cookieHeader = buildCookieHeaderFromPairs(
      store.getAll(),
      FORWARD_COOKIES
    );
    if (!cookieHeader) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // 2) Body + IP del cliente original
    const body = await request.json();
    const ipAddress = extractServerIp(request);

    // 3) Llamado al Core
    const backendRes = await axios.post(
      `${process.env.BACKEND_URL}${CORE_PATH}`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": String(process.env.CORE_API_KEY),
          "X-Real-IP": ipAddress,
          "X-Forwarded-For": ipAddress,
          Cookie: cookieHeader,
        },
        timeout: 15_000,
        validateStatus: () => true,
        withCredentials: true,
      }
    );

    // 4) Respuesta al navegador
    return NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });
  } catch (err) {
    const status =
      axios.isAxiosError(err) && err.response ? err.response.status : 500;
    const message =
      axios.isAxiosError(err) && err.response
        ? err.response.data?.message || err.response.statusText
        : err instanceof Error
        ? err.message
        : "Error desconocido";

    return NextResponse.json({ message }, { status });
  }
}
