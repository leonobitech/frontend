import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractServerIp } from "@/lib/extractIp";
import type { ClientMeta } from "@/types/meta";

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

/**
 * POST /api/password/reset
 * Reset password with verification code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword, requestId, meta: clientMeta } = body;

    // Validaciones básicas
    if (!email || !code || !newPassword || !requestId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { message: "Code must be 6 digits" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Extraer headers de trazabilidad
    const clientRequestId = request.headers.get("X-Request-ID") || "";
    const idempotencyKey = request.headers.get("Idempotency-Key") || "";

    // Capturar IP del servidor y construir meta completo
    const ipAddress = extractServerIp(request);
    const parsed = MetaSchema.safeParse(clientMeta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }
    const meta: ClientMeta = { ...parsed.data, ipAddress };

    // Conectar con backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/password/reset`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "X-Request-ID": clientRequestId,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ email, code, newPassword, requestId, meta }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || "Failed to reset password",
          resend: data.resend || false,
          requestId: data.requestId,
          expiresIn: data.expiresIn,
        },
        { status: response.status }
      );
    }

    // Si el backend devuelve cookies (inicio de sesión automático), propagarlas
    const setCookieHeader = response.headers.get("set-cookie");
    const headers = new Headers();

    if (setCookieHeader) {
      headers.set("set-cookie", setCookieHeader);
    }

    return NextResponse.json(
      {
        message: data.message || "Password reset successfully",
        data: data.data,
      },
      { headers }
    );
  } catch (error) {
    console.error("[Password Reset Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
