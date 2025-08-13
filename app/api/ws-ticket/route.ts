import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios, { AxiosError } from "axios";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";
// import type { ClientMeta } from "@/types/meta";
// import { setClientMetaCookie } from "@/lib/cookies/setClientMetaCookie";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* -------------------------- Zod: meta del cliente -------------------------- */
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
  label: z.string().default("ws-ticket"),
  path: z.string().optional(),
  method: z.string().optional(),
  host: z.string().optional(),
});
type MetaInput = z.infer<typeof MetaSchema>;

/* ------------------------------ Tipos de Core ------------------------------ */
interface CoreUser {
  id: string;
  tenantId?: string;
  role?: string;
  email?: string;
}
interface CoreSessionResponse {
  user?: CoreUser;
}

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
    const body = await request.json().catch(() => ({}));
    const parsed = MetaSchema.safeParse((body as { meta?: unknown }).meta);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Meta inválido", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const metaIn: MetaInput = parsed.data;

    /* ----------------------------- IP + requestId ----------------------------- */
    const ipAddress = extractServerIp(request);
    const requestId = uuidv4();

    /* ----------------------- Meta final para el backend Core ----------------------- */
    const metaForCore = {
      ...metaIn,
      label: metaIn.label || "ws-ticket",
      path: metaIn.path ?? "/leonobit",
      method: metaIn.method ?? "POST",
      host: metaIn.host ?? "",
      ipAddress, // 👈 agregado del lado server
    };

    /* -------------------- Llamada a Core para autorizar acceso ------------------- */
    const coreRes = await axios.post<CoreSessionResponse>(
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

    if (coreRes.status !== 200 || !coreRes.data?.user?.id) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    const user = coreRes.data.user;

    /* ---------------- Ticket JWT corto (60s) para el handshake WS ---------------- */
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

    /* --------- (Opcional) Persistir clientMeta si te interesa en cookies --------- */
    // const response = NextResponse.json({ token });
    // setClientMetaCookie(response, metaForCore as ClientMeta);
    // response.headers.set("Cache-Control", "no-store");
    // return response;

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
