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

    // Build profile data, only include defined fields
    const profileData: Record<string, unknown> = { meta };
    if (name !== undefined) profileData.name = name;
    if (email !== undefined) profileData.email = email;
    if (bio !== undefined) profileData.bio = bio;
    if (website !== undefined) profileData.website = website;
    if (location !== undefined) profileData.location = location;
    if (socialTwitter !== undefined) profileData.socialTwitter = socialTwitter;
    if (socialInstagram !== undefined) profileData.socialInstagram = socialInstagram;
    if (socialYoutube !== undefined) profileData.socialYoutube = socialYoutube;
    if (socialGithub !== undefined) profileData.socialGithub = socialGithub;
    if (avatar !== undefined) profileData.avatar = avatar;

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
      body: JSON.stringify(profileData),
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
