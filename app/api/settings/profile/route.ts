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
 * PATCH /api/settings/profile
 * Update user profile information
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      bio,
      website,
      location,
      socialTwitter,
      socialInstagram,
      socialYoutube,
      socialGithub,
      avatar,
      meta: clientMeta
    } = body;

    // Extraer headers de trazabilidad
    const requestId = request.headers.get("X-Request-ID") || "";
    const idempotencyKey = request.headers.get("Idempotency-Key") || "";

    // Capturar IP del servidor y construir meta completo
    const ipAddress = extractServerIp(request);
    const parsed = MetaSchema.safeParse(clientMeta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }
    const meta: ClientMeta = { ...parsed.data, ipAddress };

    // Conectar con backend
    const response = await fetch(`${process.env.BACKEND_URL}/account/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": request.headers.get("cookie") || "",
        "x-core-access-key": process.env.CORE_API_KEY || "",
        "X-Request-ID": requestId,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        name,
        email,
        bio,
        website,
        location,
        socialTwitter,
        socialInstagram,
        socialYoutube,
        socialGithub,
        avatar,
        meta
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to update profile" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message || "Profile updated successfully",
      user: data.user,
    });
  } catch (error) {
    console.error("[Profile Update Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
