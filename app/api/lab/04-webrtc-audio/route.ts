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
 * POST /api/lab/04-webrtc-audio
 *
 * Flow:
 * 1) (Opcional) valida sesión contra Core si vienen meta/user/session (Lab-03-like).
 * 2) Emite JWT (iss=lab-04, aud=lab-webrtc-04-audio) firmado con WS_JWT_SECRET.
 * 3) Reenvía la SDP offer al backend Axum → POST {AXUM_API_ORIGIN}/webrtc/lab/04/offer
 *    - Headers: Authorization: Bearer <token>, Origin: <site origin>
 * 4) Devuelve la SDP answer al cliente.
 */

// ---------- Schemas ----------
const OfferSchema = z.object({
  type: z.string().min(1), // usualmente "offer"
  sdp: z.string().min(1),
});

const MetaSchema = z.object({
  deviceInfo: z
    .object({
      device: z.string(),
      os: z.string(),
      browser: z.string(),
    })
    .partial()
    .optional(),
  userAgent: z.string().optional(),
  language: z.string().optional(),
  platform: z.string().optional(),
  timezone: z.string().optional(),
  screenResolution: z.string().optional(),
  label: z.string().optional(),
  path: z.string().optional().default("/lab/04-webrtc-audio"),
  method: z.string().optional().default("POST"),
  host: z.string().optional().default(""),
});

const OptionalSessionSchema = z
  .object({
    id: z.string().min(1),
    isRevoked: z.boolean().optional().default(false),
    expiresAt: z.preprocess(
      (v) => (typeof v === "string" ? new Date(v) : v),
      z.date()
    ),
  })
  .optional();

const OptionalUserSchema = z
  .object({
    id: z.string().min(1),
    role: z.string().optional(),
    email: z.string().email().optional(),
  })
  .optional();

const BodySchemaFlexible = z.object({
  // Requerido siempre:
  offer: OfferSchema,
  // Opcional (si se manda en modo "Lab-03-like"):
  meta: MetaSchema.optional(),
  user: OptionalUserSchema,
  session: OptionalSessionSchema,
});

export async function POST(request: Request) {
  try {
    // ---------- Env obligatorias ----------
    const BACKEND_URL = process.env.BACKEND_URL; // p.ej. https://core.leonobitech.com
    const AXUM_API_ORIGIN = process.env.AXUM_API_ORIGIN; // p.ej. https://leonobit.leonobitech.com
    const CORE_API_KEY = process.env.CORE_API_KEY;
    const WS_JWT_SECRET = process.env.WS_JWT_SECRET;
    if (!AXUM_API_ORIGIN || !WS_JWT_SECRET) {
      return NextResponse.json({ message: "misconfigured" }, { status: 500 });
    }

    // ---------- Parse body flexible ----------
    const raw = (await request.json().catch(() => ({}))) as unknown;
    const parsed = BodySchemaFlexible.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "invalid body", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { meta, user, session, offer } = parsed.data;

    // ---------- (Opcional) Validación con Core si vienen user/session/meta ----------
    let sub = "lab04-anon";
    let role: string | undefined = undefined;
    let email: string | undefined = undefined;

    if (user?.id) sub = user.id;
    if (user?.role) role = user.role;
    if (user?.email) email = user.email;

    if (meta && user && session && BACKEND_URL && CORE_API_KEY) {
      // Verificar sesión (igual que Lab-03)
      const cookieStore = cookies();
      const allowed = ["accessKey", "clientKey"];
      const cookiesToSend: string[] = [];
      (await cookieStore).getAll().forEach(({ name, value }) => {
        if (allowed.includes(name)) cookiesToSend.push(`${name}=${value}`);
      });
      const cookieHeader = cookiesToSend.join("; ");

      const expDate = session.expiresAt?.getTime?.();
      if (
        session.isRevoked ||
        !isFinite(expDate || NaN) ||
        (expDate as number) <= Date.now()
      ) {
        return NextResponse.json(
          { message: "session expired" },
          { status: 401 }
        );
      }

      const ipAddress = extractServerIp(request);
      const requestId = uuidv4();

      const metaForCore = { ...(meta ?? {}), ipAddress };

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
    }

    // ---------- JWT (Lab-04) ----------
    const requestId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        tid: "lab",
        label: "lab-04-webrtc-audio",
        path: "/lab/04-webrtc-audio",
        role,
        email,
        iat: now,
        exp: now + 5 * 60, // 5 min
        jti: requestId,
      } as Record<string, unknown>,
      WS_JWT_SECRET,
      {
        algorithm: "HS256",
        audience: "lab-webrtc-04-audio", // aud específico del lab-04
        issuer: "lab-04", // iss específico del lab-04
        subject: String(sub),
      }
    );

    // ---------- Señalización al backend Axum ----------
    const siteOrigin = new URL(request.url).origin; // Origin real del sitio (para validar en Axum)

    const backendRes = await axios.post(
      `${AXUM_API_ORIGIN}/webrtc/lab/04/offer`,
      { type: offer.type, sdp: offer.sdp },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Origin: siteOrigin,
          "X-Request-ID": requestId,
        },
        validateStatus: () => true,
        timeout: 10_000,
      }
    );

    if (backendRes.status !== 200) {
      return NextResponse.json(
        {
          message: "signaling failed",
          status: backendRes.status,
          backend: backendRes.data,
        },
        { status: 502 }
      );
    }

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
