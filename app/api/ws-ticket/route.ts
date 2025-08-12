// app/api/ws-ticket/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import axios from "axios";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { extractServerIp } from "@/lib/extractIp"; // fallback por si lo necesitas

// Evitar caché en Vercel/Edge
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CoreSessionResponse {
  user?: {
    id: string;
    tenantId?: string;
    role?: string;
    email?: string;
  };
}

// -- Helpers ---------------------------------------------------------------

function firstFromXff(xff: string): string | "" {
  // X-Forwarded-For: "client, proxy1, proxy2"
  const first = xff.split(",")[0]?.trim();
  return first || "";
}

function safeJsonParse<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------------

export async function GET(req: Request) {
  try {
    // ✅ ENV obligatorios
    const BACKEND_URL = process.env.BACKEND_URL;
    const CORE_API_KEY = process.env.CORE_API_KEY;
    const WS_JWT_SECRET = process.env.WS_JWT_SECRET;

    if (!BACKEND_URL || !CORE_API_KEY || !WS_JWT_SECRET) {
      return NextResponse.json({ message: "misconfigured" }, { status: 500 });
    }

    // 🍪 Cookies requeridas
    const store = cookies();
    const allowed = ["accessKey", "clientKey", "clientMeta"]; // clientMeta es opcional pero útil
    const cookieHeader = (await store)
      .getAll()
      .filter(({ name }) => allowed.includes(name))
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    if (
      !cookieHeader.includes("accessKey") ||
      !cookieHeader.includes("clientKey")
    ) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // 🧾 Cabeceras del request original (usar await headers())
    const hdrs = await headers();
    const userAgent = hdrs.get("user-agent") || "unknown";
    const acceptLang = hdrs.get("accept-language") || "";
    const xff = hdrs.get("x-forwarded-for") || "";
    const realIpHdr = hdrs.get("x-real-ip") || "";
    const cfIp = hdrs.get("cf-connecting-ip") || "";
    // IP priorizada: Cloudflare > XFF (primera) > X-Real-IP > fallback util
    const clientIp =
      cfIp || firstFromXff(xff) || realIpHdr || extractServerIp(req) || "";

    // 📦 Intentar leer meta del cliente (si existe cookie clientMeta)
    type ClientMeta = {
      deviceInfo?: { device?: string; os?: string; browser?: string };
      userAgent?: string;
      language?: string;
      platform?: string;
      timezone?: string;
      screenResolution?: string;
      label?: string;
      ipAddress?: string;
    };

    const clientMetaCookie = (await store).get("clientMeta")?.value;
    const metaFromCookie = safeJsonParse<ClientMeta>(clientMetaCookie) || {};

    // Construimos una meta mínima y consistente para Core
    const meta = {
      deviceInfo: {
        device: metaFromCookie.deviceInfo?.device || "Unknown",
        os: metaFromCookie.deviceInfo?.os || "Unknown",
        browser: metaFromCookie.deviceInfo?.browser || "Unknown",
      },
      userAgent: metaFromCookie.userAgent || userAgent,
      language: metaFromCookie.language || acceptLang,
      platform: metaFromCookie.platform || "",
      timezone: metaFromCookie.timezone || "",
      screenResolution: metaFromCookie.screenResolution || "",
      label: metaFromCookie.label || "ws-ticket",
      ipAddress: clientIp,
    };

    // 🔗 Validar sesión/permiso en tu Core para /admin/leonobit
    const coreRes = await axios.post<CoreSessionResponse>(
      `${BACKEND_URL}/admin/leonobit`,
      { meta },
      {
        headers: {
          Cookie: cookieHeader,
          "x-core-access-key": CORE_API_KEY,
          "X-Real-IP": clientIp,
          "X-Forwarded-For": clientIp,
          "Content-Type": "application/json",
          "User-Agent": userAgent,
        },
        withCredentials: true,
        validateStatus: () => true,
        timeout: 5000,
      }
    );

    const data = coreRes.data;

    if (coreRes.status !== 200 || !data?.user?.id) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // 🎟️ Emitir ticket JWT muy corto para WS (60s)
    const user = data.user!;
    const jti = uuidv4();
    const token = jwt.sign(
      {
        sub: user.id,
        tid: user.tenantId ?? "default",
        aud: "ws",
        role: user.role ?? "user",
        email: user.email ?? undefined,
      },
      WS_JWT_SECRET,
      { expiresIn: "60s", issuer: "leonobit", jwtid: jti }
    );

    // (Opcional) Anti-replay con Redis: redis.set(`ws:jti:${jti}`, "1", { EX: 90 })

    const res = NextResponse.json({ token });
    res.headers.set("Cache-Control", "no-store");
    return res;
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
