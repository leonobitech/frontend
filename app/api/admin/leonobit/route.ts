import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { extractServerIp } from "@/lib/extractIp";
import type { ClientMeta } from "@/types/meta";
import { setClientMetaCookie } from "@/lib/cookies/setClientMetaCookie";

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
    const cookieHeader = (await cookieStore)
      .getAll()
      .filter(({ name }) => allowed.includes(name))
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const ipAddress = extractServerIp(request);
    const body = await request.json();
    const parsed = MetaSchema.safeParse(body.meta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }

    const requestId = uuidv4();
    const meta = { ...parsed.data, ipAddress };

    // 👇 Ruta de tu Core que emite la URL final hacia leonobit
    const backendRes = await axios.post(
      `${process.env.BACKEND_URL}/admin/leonobit`,
      { meta },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY!,
          "X-Request-ID": requestId,
          Cookie: cookieHeader,
          "X-Real-IP": ipAddress,
          "X-Forwarded-For": ipAddress,
        },
        withCredentials: true,
      }
    );

    const setCookies = backendRes.headers["set-cookie"] || [];
    const response = NextResponse.json(backendRes.data);
    if (Array.isArray(setCookies)) {
      setCookies.forEach((cookie) =>
        response.headers.append("Set-Cookie", cookie)
      );
    } else if (typeof setCookies === "string") {
      response.headers.append("Set-Cookie", setCookies);
    }

    // persistimos meta del cliente
    setClientMetaCookie(response, meta as ClientMeta);

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
