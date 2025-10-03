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

    // Forward to backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/passkey/login/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "X-Request-ID": requestId,
          "Idempotency-Key": idempotencyKey,
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

    // Forward Set-Cookie headers from backend
    const setCookieHeader = response.headers.get("set-cookie");
    const headers = new Headers();

    if (setCookieHeader) {
      headers.set("set-cookie", setCookieHeader);
    }

    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error("[Passkey Login Verify Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
