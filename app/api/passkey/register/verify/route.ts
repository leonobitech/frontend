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
 * POST /api/passkey/register/verify
 * Verify passkey registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, name, meta: clientMeta } = body;

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

    // Forward to backend with client headers
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/passkey/register/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "X-Request-ID": requestId,
          "Idempotency-Key": idempotencyKey,
          "User-Agent": request.headers.get("user-agent") || "",
          "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
          "X-Real-IP": request.headers.get("x-real-ip") || "",
        },
        body: JSON.stringify({ credential, name, meta }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to verify passkey" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Passkey Register Verify Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
