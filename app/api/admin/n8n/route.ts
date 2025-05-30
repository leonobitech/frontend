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
    const cookieStore = cookies();
    const allowed = ["accessKey", "clientKey"];
    const cookiesToSend: string[] = [];

    (await cookieStore).getAll().forEach(({ name, value }) => {
      if (allowed.includes(name)) cookiesToSend.push(`${name}=${value}`);
    });

    const cookieHeader = cookiesToSend.join("; ");
    const ipAddress = extractServerIp(request);
    const body = await request.json();

    const parsed = MetaSchema.safeParse(body.meta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }

    const requestId = uuidv4();
    const meta = { ...parsed.data, ipAddress };

    // 🔐 Setear cookie clientMeta con la metadata completa
    const response = NextResponse.json({ success: true }); // Lo inicializamos primero
    response.cookies.set({
      name: "clientMeta",
      value: encodeURIComponent(JSON.stringify(meta)),
      httpOnly: false, // Para que el frontend la pueda leer
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    // 📡 Hacer la request al backend Core con la meta y cookies
    const backendRes = await axios.post(
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

    // Devolver la data del backend (n8n URL)
    response.json = backendRes.data; // NextResponse permite enviar JSON directamente

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
