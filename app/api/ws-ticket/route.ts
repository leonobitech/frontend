// app/api/ws-ticket/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import axios, { AxiosError } from "axios";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { extractServerIp } from "@/lib/extractIp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ClientDeviceInfo {
  device: string;
  os: string;
  browser: string;
}

interface ClientMeta {
  deviceInfo: ClientDeviceInfo;
  userAgent: string;
  language: string;
  platform: string;
  timezone: string;
  screenResolution: string;
  label: string;
  ipAddress: string;
}

interface CoreUser {
  id: string;
  tenantId?: string;
  role?: string;
  email?: string;
}

interface CoreSessionResponse {
  user?: CoreUser;
}

function firstFromXff(xff: string): string | null {
  const parts = xff
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts[0] : null;
}

export async function GET(req: Request) {
  try {
    if (
      !process.env.BACKEND_URL ||
      !process.env.CORE_API_KEY ||
      !process.env.WS_JWT_SECRET
    ) {
      return NextResponse.json({ message: "misconfigured" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const allowed = ["accessKey", "clientKey", "clientMeta"];
    const cookieHeader = cookieStore
      .getAll()
      .filter(({ name }) => allowed.includes(name))
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    const hdrs = await headers();
    const userAgent = hdrs.get("user-agent") || "unknown";
    const acceptLang = hdrs.get("accept-language") || "";
    const xff = hdrs.get("x-forwarded-for") || "";
    const realIpHdr = hdrs.get("x-real-ip") || "";
    const cfIp = hdrs.get("cf-connecting-ip") || "";
    const clientIp = cfIp || firstFromXff(xff) || realIpHdr || "";

    // Parseamos la cookie clientMeta si existe
    let clientMetaFromCookie: Partial<ClientMeta> = {};
    const metaCookie = cookieStore.get("clientMeta")?.value;
    if (metaCookie) {
      try {
        clientMetaFromCookie = JSON.parse(decodeURIComponent(metaCookie));
      } catch {
        clientMetaFromCookie = {};
      }
    }

    const mergedMeta: ClientMeta = {
      deviceInfo: {
        device: clientMetaFromCookie.deviceInfo?.device ?? "Desktop",
        os: clientMetaFromCookie.deviceInfo?.os ?? "Unknown",
        browser: clientMetaFromCookie.deviceInfo?.browser ?? "Unknown",
      },
      userAgent,
      language:
        clientMetaFromCookie.language ?? acceptLang.split(",")[0] ?? "en",
      platform: clientMetaFromCookie.platform ?? "",
      timezone: clientMetaFromCookie.timezone ?? "",
      screenResolution: clientMetaFromCookie.screenResolution ?? "",
      label: "ws-ticket",
      ipAddress:
        clientMetaFromCookie.ipAddress ?? extractServerIp(req) ?? clientIp,
    };

    const coreRes = await axios.post<CoreSessionResponse>(
      `${process.env.BACKEND_URL}/admin/leonobit`,
      { meta: mergedMeta },
      {
        headers: {
          Cookie: cookieHeader,
          "x-core-access-key": process.env.CORE_API_KEY!,
          "X-Real-IP": mergedMeta.ipAddress,
          "X-Forwarded-For": mergedMeta.ipAddress,
          "Content-Type": "application/json",
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
      process.env.WS_JWT_SECRET!,
      { expiresIn: "60s", issuer: "leonobit", jwtid: jti }
    );

    const res = NextResponse.json({ token });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    let status = 500;
    let message = "Error desconocido";

    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      status = axiosErr.response?.status ?? 500;
      message =
        axiosErr.response?.data?.message ??
        axiosErr.response?.statusText ??
        axiosErr.message;
    } else if (err instanceof Error) {
      message = err.message;
    }

    return NextResponse.json({ message }, { status });
  }
}
