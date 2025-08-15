import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios, { AxiosError } from "axios";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/lab/03-webrtc-metrics
 *
 * Server-side:
 * 1) Valida sesión con Core (cookies) y body (meta/user/session).
 * 2) Emite JWT (iss=lab-03, aud=lab-webrtc-03-metrics) firmado con WS_JWT_SECRET.
 * 3) Reenvía la offer SDP al backend Axum → POST /webrtc/lab/03/offer
 *    - Headers: Authorization: Bearer <token>, Origin: <site origin>
 * 4) Devuelve la answer SDP al cliente.
 */

// --------- Schemas ----------
const OfferSchema = z.object({
  type: z.string().min(1), // típicamente "offer"
  sdp: z.string().min(1),
});

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
  path: z.string().optional().default("/lab/03-webrtc-rt-metrics"),
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
    // ISO string o Date → normalizamos a Date
    expiresAt: z.preprocess(
      (v) => (typeof v === "string" ? new Date(v) : v),
      z.date()
    ),
  }),
  offer: OfferSchema,
});

export async function POST(request: Request) {
  try {
    // ---------- Env obligatorias ----------
    const BACKEND_URL = process.env.BACKEND_URL; // p.ej. https://core.leonobitech.com
    const CORE_API_KEY = process.env.CORE_API_KEY;
    const WS_JWT_SECRET = process.env.WS_JWT_SECRET;
    const NEXT_PUBLIC_API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN; // p.ej. https://leonobit.leonobitech.com
    if (!BACKEND_URL || !CORE_API_KEY || !WS_JWT_SECRET) {
      return NextResponse.json({ message: "misconfigured" }, { status: 500 });
    }

    // ---------- Cookies hacia Core ----------
    const cookieStore = cookies();
    const allowed = ["accessKey", "clientKey"];
    const cookieHeader = (await cookieStore)
      .getAll()
      .filter(({ name }) => allowed.includes(name))
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // ---------- Body + validación ----------
    const raw = (await request.json().catch(() => ({}))) as unknown;
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "invalid body", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { meta, user, session, offer } = parsed.data;

    // ---------- Sesión válida ----------
    const expDate = session.expiresAt.getTime();
    if (session.isRevoked || !isFinite(expDate) || expDate <= Date.now()) {
      return NextResponse.json({ message: "session expired" }, { status: 401 });
    }

    // ---------- IP + requestId ----------
    const ipAddress = extractServerIp(request);
    const requestId = uuidv4();

    // ---------- Meta final hacia Core ----------
    const metaForCore = { ...meta, ipAddress };

    // ---------- Autorización en Core (mismo que lab-02) ----------
    const coreRes = await axios.post(
      `${BACKEND_URL}/admin/leonobit`,
      { meta: metaForCore },
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
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // ---------- Ticket JWT (lab-03) ----------
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        tid: "lab",
        label: "lab-03-webrtc-rt-metrics",
        path: "/lab/03-webrtc-rt-metrics",
        role: user.role,
        email: user.email,
        iat: now,
        exp: now + 5 * 60, // 5 min
        jti: requestId,
      } as Record<string, unknown>,
      WS_JWT_SECRET,
      {
        algorithm: "HS256",
        audience: "lab-webrtc-03-metrics", // aud específico del lab-03
        issuer: "lab-03", // iss específico del lab-03
        subject: String(user.id),
      }
    );

    // ---------- Señalización hacia backend Axum ----------
    // El backend valida ORIGIN; usamos el origin real del sitio (no del backend).
    const siteOrigin = new URL(request.url).origin; // p.ej. https://www.leonobitech.com

    const backendRes = await axios.post(
      `${NEXT_PUBLIC_API_ORIGIN}/webrtc/lab/03/offer`,
      { type: offer.type, sdp: offer.sdp },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Origin: siteOrigin,
          "X-Request-ID": requestId,
        },
        validateStatus: () => true,
        timeout: 8000,
      }
    );

    if (backendRes.status !== 200) {
      return NextResponse.json(
        { message: "signaling failed", status: backendRes.status },
        { status: 502 }
      );
    }

    // backend Axum devuelve { sdp, type: "answer" }
    const answer = backendRes.data as { sdp: string; type: string };

    const res = NextResponse.json(answer);
    res.headers.set("Cache-Control", "no-store");
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
    return NextResponse.json({ message }, { status });
  }
}
