// frontend/app/api/passkey/login/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";
import type { ClientMeta } from "@/types/meta";

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

/**
 * POST /api/passkey/login/verify
 * Verify passkey login and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, meta: clientMeta } = body;

    // Extract traceability headers
    const requestId = request.headers.get("X-Request-ID") || "";
    const idempotencyKey = request.headers.get("Idempotency-Key") || "";

    // Validate and add server IP to meta
    const ipAddress = extractServerIp(request);
    const parsed = MetaSchema.safeParse(clientMeta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }
    const meta: ClientMeta = { ...parsed.data, ipAddress };

    // Forward to backend with client metadata
    // IMPORTANT: Use meta.userAgent (from browser) instead of server's User-Agent
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/passkey/login/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "X-Request-ID": requestId,
          "Idempotency-Key": idempotencyKey,
          "User-Agent": meta.userAgent, // Use client's User-Agent, not server's
        },
        body: JSON.stringify({ credential, meta }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to verify passkey" },
        { status: response.status }
      );
    }

    // ✅ CORRECCIÓN: Obtener TODAS las cookies correctamente
    // Next.js proporciona getSetCookie() que retorna un array con todas las cookies
    const cookies = response.headers.getSetCookie();
    
    // Crear la respuesta
    const nextResponse = NextResponse.json(data);
    
    // ✅ Agregar TODAS las cookies a la respuesta
    // Esto asegura que tanto accessKey como clientKey se setean correctamente
    if (cookies && cookies.length > 0) {
      cookies.forEach(cookie => {
        nextResponse.headers.append("set-cookie", cookie);
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("[Passkey Login Verify Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
