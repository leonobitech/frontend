import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios, { AxiosError } from "axios";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    /* ----------------------- Env obligatorias para operar ----------------------- */
    const BACKEND_URL = process.env.BACKEND_URL;
    const CORE_API_KEY = process.env.CORE_API_KEY;
    const WS_JWT_SECRET = process.env.WS_JWT_SECRET;
    if (!BACKEND_URL || !CORE_API_KEY || !WS_JWT_SECRET) {
      return NextResponse.json({ message: "misconfigured" }, { status: 500 });
    }

    /* ---------------------- Cookies que viajan hacia Core ---------------------- */
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

    /* ---------------------------- Body + validación ---------------------------- */
    const raw = await request.json().catch(() => ({} as unknown));

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
      // estos 4 pueden venir vacíos; ponemos defaults/optional para no romper
      label: z.string().default("ws-ticket"),
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
        // admite string ISO o Date y lo normaliza a Date
        expiresAt: z.preprocess(
          (v) => (typeof v === "string" ? new Date(v) : v),
          z.date()
        ),
      }),
    });

    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "invalid body", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { meta, user, session } = parsed.data;

    // Validar que la sesión no esté vencida o revocada
    const expDate = session.expiresAt.getTime();
    if (session.isRevoked || !isFinite(expDate) || expDate <= Date.now()) {
      return NextResponse.json({ message: "session expired" }, { status: 401 });
    }
    /* ----------------------------- IP + requestId ----------------------------- */
    const ipAddress = extractServerIp(request);
    const requestId = uuidv4();

    /* ----------------------- Meta final para el backend Core ----------------------- */
    const metaForCore = {
      ...meta,
      ipAddress, // 👈 agregado del lado server
    };

    /* -------------------- Llamada a Core para autorizar acceso ------------------- */
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

    /* ---------------- Ticket JWT corto (exp/iat dinámicos) -------------------- */
    const now = Math.floor(Date.now() / 1000);
    const jti = uuidv4();
    const token = jwt.sign(
      {
        // claims de negocio
        tid: "default",
        role: user.role,
        email: user.email,

        // tiempos/identidad explícitos
        iat: now,
        exp: now + 60, // 1 minuto
        jti,
        // aud/iss/sub también pueden ir en payload, pero prefiero options abajo
      } as Record<string, unknown>,
      WS_JWT_SECRET,
      {
        algorithm: "HS256",
        audience: "ws",
        issuer: "leonobit",
        subject: String(user.id),
      }
    );

    const response = NextResponse.json({ token });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    let status = 500;
    let message = "Error desconocido";

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
