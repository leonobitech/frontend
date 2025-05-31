import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { extractServerIp } from "@/lib/extractIp";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// 📝 Esquema de validación para la metadata del cliente (device info, navegador, etc.)
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
    // 🌐 Accedemos a las cookies enviadas en la request desde el cliente
    const cookieStore = cookies();

    // 🎯 Filtramos solo las cookies que nos interesan (para autenticación)
    const allowed = ["accessKey", "clientKey"];
    const cookiesToSend: string[] = [];

    // 🔄 Recorremos las cookies disponibles y preparamos el header "Cookie"
    (await cookieStore).getAll().forEach(({ name, value }) => {
      if (allowed.includes(name)) cookiesToSend.push(`${name}=${value}`);
    });

    const cookieHeader = cookiesToSend.join("; ");

    // 🌍 Obtenemos la IP del cliente usando un helper que parsea el header `x-forwarded-for`
    const ipAddress = extractServerIp(request);

    // 📦 Parseamos el body del request (debe tener un objeto `meta` con la metadata del cliente)
    const body = await request.json();

    // ✅ Validamos la estructura de la metadata con Zod
    const parsed = MetaSchema.safeParse(body.meta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }

    // 🎲 Generamos un ID único para esta request (para logging, tracing, etc.)
    const requestId = uuidv4();

    // 🔗 Combinamos la metadata enviada por el cliente con la IP extraída del request
    const meta = { ...parsed.data, ipAddress };

    // 🛰️ Hacemos la solicitud al backend Core (/admin/n8n) pasando:
    //  - La metadata del cliente en el body
    //  - Las cookies de autenticación en el header "Cookie"
    //  - Un header especial `x-core-access-key` para autorización interna
    //  - Un `X-Request-ID` para trazabilidad
    const backendRes = await axios.post(
      `${process.env.BACKEND_URL}/admin/n8n`,
      { meta },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY!, // 🔑 Clave interna del sistema
          "X-Request-ID": requestId,
          Cookie: cookieHeader,
        },
        withCredentials: true, // 🔒 Importante para manejar cookies en la request (si el backend las usa)
      }
    );

    // 🏷️ Preparamos la respuesta final para el frontend:
    // - Incluimos la URL de n8n devuelta por el backend Core
    // - Seteamos una nueva cookie `clientMeta` para futuras validaciones en Core

    // 🎯 🔥 Extraemos las cookies del backend y las reinyectamos
    const setCookies = backendRes.headers["set-cookie"] || [];
    const response = NextResponse.json(backendRes.data);

    if (Array.isArray(setCookies)) {
      setCookies.forEach((cookie) => {
        response.headers.append("Set-Cookie", cookie);
      });
    } else if (typeof setCookies === "string") {
      response.headers.append("Set-Cookie", setCookies);
    }

    // Setear cookie `clientMeta` con la metadata del cliente
    response.cookies.set({
      name: "clientMeta",
      value: encodeURIComponent(JSON.stringify(meta)), // 🔒 Codificamos la metadata en JSON
      httpOnly: true, // Permitir lectura en el frontend si es necesario (ej. para debug o logging)
      secure: true, // En producción: sólo por HTTPS
      sameSite: "strict", // Proteger contra ataques CSRF
      path: "/", // Disponible en toda la app
      domain: "leonobitech.com", // 🎯 Compartir entre subdominios (core.leonobitech.com, www.leonobitech.com, etc.)
    });

    return response;
  } catch (err: unknown) {
    // 🛑 Manejo de errores: Devuelve status y mensaje adecuado
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
