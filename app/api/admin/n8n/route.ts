// app/api/admin/n8n/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

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
});

export async function POST(request: Request) {
  try {
    const ipAddress = extractServerIp(request);
    const body = await request.json();

    const parsed = MetaSchema.safeParse(body.meta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }

    const requestId = uuidv4();
    const meta = { ...parsed.data, ipAddress };

    // 🔒 Setear primero la cookie clientMeta (así luego la podemos incluir en la request)
    (await cookies()).set({
      name: "clientMeta",
      value: encodeURIComponent(JSON.stringify(meta)),
      httpOnly: false, // para el frontend, no usamos httpOnly
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    // ✅ Ahora sí, leer TODAS las cookies (ya incluyendo clientMeta)
    const cookieStore = cookies();
    const allowed = ["accessKey", "clientKey", "clientMeta"];
    const cookiesToSend: string[] = [];

    (await cookieStore).getAll().forEach(({ name, value }) => {
      if (allowed.includes(name)) cookiesToSend.push(`${name}=${value}`);
    });

    const cookieHeader = cookiesToSend.join("; ");

    const res = await axios.post(
      `${process.env.BACKEND_URL}/admin/n8n`,
      { meta },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY!,
          "X-Request-ID": requestId,
          Cookie: cookieHeader,
        },
        withCredentials: true,
      }
    );

    const response = NextResponse.json(res.data);
    response.cookies.set(
      "clientMeta",
      encodeURIComponent(JSON.stringify(meta)),
      {
        httpOnly: false,
        secure: true,
        sameSite: "strict",
        path: "/",
      }
    );

    return response;
  } catch (err: unknown) {
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
