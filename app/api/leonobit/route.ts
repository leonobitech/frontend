// app/api/leonobit/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios, { AxiosError } from "axios";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// --------- Schemas ----------
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
  path: z.string().optional().default("/leonobit"),
  method: z.string().optional().default("POST"),
  host: z.string().optional().default(""),
});

const BodySchema = z.object({
  meta: MetaSchema,
  user: z.object({
    id: z.string().min(1),
    role: z.string().optional(),
    email: z.string().email().optional(),
  }),
  session: z.object({
    id: z.string().min(1),
    isRevoked: z.boolean().optional().default(false),
    expiresAt: z.preprocess(
      (v) => (typeof v === "string" ? new Date(v) : v),
      z.date()
    ),
  }),
});

export async function POST(request: Request) {
  try {
    // ---------- Env obligatorias ----------
    const BACKEND_URL = process.env.BACKEND_URL; // p.ej. https://core.leonobitech.com
    const CORE_API_KEY = process.env.CORE_API_KEY;
    const WS_JWT_SECRET = process.env.WS_JWT_SECRET;
    const AXUM_API_ORIGIN = process.env.AXUM_API_ORIGIN; // p.ej. https://leonobit.leonobitech.com

    if (!BACKEND_URL || !CORE_API_KEY || !WS_JWT_SECRET || !AXUM_API_ORIGIN) {
      return NextResponse.json(
        { ok: false, message: "misconfigured" },
        { status: 500 }
      );
    }

    /* ---------------------- Cookies hacia Core (tu versión) ---------------------- */
    const cookieStore = cookies();
    const allowed = ["accessKey", "clientKey", "sidebar_state"];
    const cookieHeader = (await cookieStore)
      .getAll()
      .filter(({ name }) => allowed.includes(name))
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");
    if (!cookieHeader) {
      return NextResponse.json(
        { ok: false, message: "unauthorized" },
        { status: 401 }
      );
    }

    /* ---------------------------- Body + validación ---------------------------- */
    const raw = await request.json().catch(() => ({} as unknown));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "invalid body", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { meta, user, session } = parsed.data;

    /* ----------------------------- IP + requestId ----------------------------- */
    const ipAddress = extractServerIp(request);
    const requestId = uuidv4();

    /* -------------------- Autorización en Core -------------------- */
    const coreRes = await axios.post(
      `${BACKEND_URL}/account/me`,
      { meta: { ...meta, ipAddress } },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": CORE_API_KEY,
          "X-Request-ID": requestId,
          Cookie: cookieHeader,
          "X-Real-IP": ipAddress,
          "X-Forwarded-For": ipAddress,
        },
        withCredentials: true,
        validateStatus: () => true,
        timeout: 5000,
      }
    );
    if (coreRes.status !== 200) {
      return NextResponse.json(
        { ok: false, message: "unauthorized" },
        { status: 401 }
      );
    }

    // Extraer identidad real del Core
    const coreUser = coreRes.data?.user;
    const coreSession = coreRes.data?.session;

    if (!coreUser?.id || !coreSession?.id) {
      return NextResponse.json(
        { ok: false, message: "invalid core response" },
        { status: 500 }
      );
    }

    const resolvedRole = coreUser.role ?? user.role;
    const resolvedEmail = coreUser.email ?? user.email;

    const expDate = new Date(coreSession.expiresAt ?? session.expiresAt).getTime();
    if (!isFinite(expDate) || expDate <= Date.now() || coreSession.isRevoked) {
      return NextResponse.json(
        { ok: false, message: "session expired" },
        { status: 401 }
      );
    }

    /* ---------------- Ticket JWT (línea base) ---------------- */
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        tid: "leonobit",
        label: "leonobit",
        path: meta.path,
        role: resolvedRole,
        email: resolvedEmail,
        sid: coreSession.id,
        iat: now,
        exp: now + 5 * 60, // 5 min
        jti: uuidv4(),
      } as Record<string, unknown>,
      WS_JWT_SECRET,
      {
        algorithm: "HS256",
        audience: "leonobit",
        issuer: "leonobit",
        subject: String(coreUser.id),
      }
    );

    const res = NextResponse.json({ ok: true, token });
    return res;
  } catch (err) {
    let status = 500;
    let message = "unknown error";
    if (axios.isAxiosError(err)) {
      const e = err as AxiosError<{ message?: string }>;
      status = e.response?.status ?? 500;
      message =
        e.response?.data?.message ?? e.response?.statusText ?? e.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ ok: false, message }, { status });
  }
}
