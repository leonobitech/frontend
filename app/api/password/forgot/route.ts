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
 * POST /api/password/forgot
 * Request password reset code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, meta: clientMeta } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Capturar IP del servidor y construir meta completo
    const ipAddress = extractServerIp(request);
    const parsed = MetaSchema.safeParse(clientMeta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }
    const meta: ClientMeta = { ...parsed.data, ipAddress };

    // Conectar con backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/password/forgot`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY || "",
        },
        body: JSON.stringify({ email, meta }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to send reset code" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message || "Reset code sent successfully",
      data: data.data,
    });
  } catch (error) {
    console.error("[Password Forgot Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
