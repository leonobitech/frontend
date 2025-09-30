// app/api/admin/n8n/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { extractServerIp } from "@/lib/extractIp";
import type { ClientMeta } from "@/types/meta";
import { setClientMetaCookie } from "@/lib/cookies/setClientMetaCookie";

// ===== Config =====
const CORE_PATH = "/admin/odoo"; // cambia por /admin/<name_service>.
const FORWARD_COOKIES = ["accessKey", "clientKey"] as const; // cookies que enviamos al Core
const REINJECT_COOKIES = ["accessKey", "clientKey"] as const; // cookies que dejamos volver del Core

// ===== Tipos utilitarios =====
type CookiePair = { name: string; value: string };
type CookieStore = { getAll(): CookiePair[] };

// Soporta runtimes donde cookies() es sync o async (Promise-like)
async function getCookieStore(): Promise<CookieStore> {
  const maybe = cookies() as unknown;
  if (maybe && typeof (maybe as Promise<CookieStore>).then === "function") {
    return (await (maybe as Promise<CookieStore>)) as CookieStore;
  }
  return maybe as CookieStore;
}

// ===== Schema =====
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

// ===== Utils =====
function extractSetCookieName(line: string | undefined): string | undefined {
  if (!line) return undefined;
  const first = line.split(";")[0] ?? "";
  const name = first.split("=")[0]?.trim();
  return name || undefined;
}

function buildCookieHeaderFromPairs(
  pairs: CookiePair[],
  names: readonly string[]
): string | undefined {
  const selected = pairs
    .filter((c) => (names as readonly string[]).includes(c.name))
    .map((c) => `${c.name}=${c.value}`);
  return selected.length ? selected.join("; ") : undefined;
}

export async function POST(request: Request) {
  try {
    // 1) Auth cookies (fail-fast si faltan)
    const store = await getCookieStore(); // <-- aquí sí usamos await
    const cookieHeader = buildCookieHeaderFromPairs(
      store.getAll(),
      FORWARD_COOKIES
    );
    if (!cookieHeader) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // 2) Body + validación + IP (huella del primer request)
    const ipAddress = extractServerIp(request);
    const body = await request.json();
    const parsed = MetaSchema.safeParse(body.meta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }
    const meta: ClientMeta = { ...parsed.data, ipAddress };

    // 3) Trazabilidad
    const requestId = request.headers.get("X-Request-ID") ?? uuidv4();
    const idemKey = request.headers.get("Idempotency-Key") ?? requestId;

    // 4) Llamado al Core (solo cookies de auth + meta en body)
    const backendRes = await axios.post(
      `${process.env.BACKEND_URL}${CORE_PATH}`,
      { meta },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": String(process.env.CORE_API_KEY),
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
          "X-Real-IP": ipAddress,
          "X-Forwarded-For": ipAddress,
          "Cache-Control": "no-store",
          Cookie: cookieHeader,
        },
        timeout: 15_000,
        validateStatus: () => true,
        withCredentials: true,
      }
    );

    // 5) Respuesta al navegador
    const res = NextResponse.json(backendRes.data, {
      status: backendRes.status,
    });
    res.headers.set("X-Request-ID", requestId);
    res.headers.set("Idempotency-Key", idemKey);
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Vary", "Cookie, Authorization");

    // 6) Reinyectar SOLO accessKey/clientKey si el Core las refresca
    const setCookieHeader = backendRes.headers["set-cookie"];
    if (Array.isArray(setCookieHeader)) {
      for (const raw of setCookieHeader) {
        const name = extractSetCookieName(raw);
        if (name && (REINJECT_COOKIES as readonly string[]).includes(name)) {
          res.headers.append("Set-Cookie", raw);
        }
      }
    } else if (typeof setCookieHeader === "string") {
      const name = extractSetCookieName(setCookieHeader);
      if (name && (REINJECT_COOKIES as readonly string[]).includes(name)) {
        res.headers.append("Set-Cookie", setCookieHeader);
      }
    }

    // 7) SIEMPRE setear clientMeta acá (para la nueva ventana del servicio)
    setClientMetaCookie(res, meta);

    return res;
  } catch (err) {
    // 🛑 Manejo de errores (tu versión exacta)
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
