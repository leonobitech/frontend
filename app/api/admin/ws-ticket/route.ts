// app/api/ws-ticket/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { extractServerIp } from "@/lib/extractIp";
// import { redis } from "@/lib/redis"; // opcional

// Evita que Vercel cachee esta ruta
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

export async function GET(req: Request) {
  try {
    // 🔒 Verificar envs obligatorios
    if (
      !process.env.BACKEND_URL ||
      !process.env.CORE_API_KEY ||
      !process.env.WS_JWT_SECRET
    ) {
      return NextResponse.json({ message: "misconfigured" }, { status: 500 });
    }

    // 1️⃣ Tomar cookies necesarias para auth
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

    // 2️⃣ IP del cliente
    const ipAddress = extractServerIp(req);

    // 3️⃣ Llamar a tu Core para validar sesión
    const coreRes = await axios.post<CoreSessionResponse>(
      `${process.env.BACKEND_URL}/admin/leonobit`,
      { meta: {} }, // si no necesitas metadata para validar, lo dejas vacío
      {
        headers: {
          Cookie: cookieHeader,
          "x-core-access-key": process.env.CORE_API_KEY!,
          "X-Real-IP": ipAddress,
          "X-Forwarded-For": ipAddress,
        },
        withCredentials: true,
        validateStatus: () => true,
        timeout: 5000, // ⏱️ Evita que se quede colgado
      }
    );

    const data = coreRes.data;

    if (coreRes.status !== 200 || !data?.user?.id) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // 4️⃣ Emitir JWT corto para WS
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

    // 5️⃣ (Opcional) Marcar en Redis para evitar replay
    // await redis.set(`ws:jti:${jti}`, "1", { EX: 90 });

    // 6️⃣ Responder con el token sin caché
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
