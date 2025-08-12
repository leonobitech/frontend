// app/api/ws-ticket/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { extractServerIp } from "@/lib/extractIp";
// import { redis } from "@/lib/redis"; // opcional

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
    const coreRes = await axios.post(
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
      }
    );

    if (coreRes.status !== 200 || !coreRes.data?.user?.id) {
      return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    // 4️⃣ Emitir JWT corto para WS
    const user = coreRes.data.user;
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

    // 6️⃣ Responder con el token
    return NextResponse.json({ token });
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
