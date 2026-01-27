// frontend/app/api/passkey/setup/verify/route.ts

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

const RequestSchema = z.object({
  pendingToken: z.string(),
  credential: z.any(), // WebAuthn credential object
  name: z.string().optional(),
  meta: MetaSchema,
});

/**
 * POST /api/passkey/setup/verify
 * Verify passkey setup and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    const { pendingToken, credential, name, meta: clientMeta } = parsed.data;

    // Extract traceability headers
    const requestId = request.headers.get("X-Request-ID") || "";
    const idempotencyKey = request.headers.get("Idempotency-Key") || "";

    // Add server IP to meta
    const ipAddress = extractServerIp(request);
    const meta: ClientMeta = { ...clientMeta, ipAddress };

    // Forward to backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/passkey/setup/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "X-Request-ID": requestId,
          "Idempotency-Key": idempotencyKey,
          "User-Agent": meta.userAgent,
        },
        body: JSON.stringify({ pendingToken, credential, name, meta }),
      }
    );

    const data = await response.json();

    // Forward Set-Cookie headers from backend
    const res = NextResponse.json(data, { status: response.status });

    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      // Split multiple cookies if present
      const cookies = setCookieHeader.split(/,(?=[^;]+=[^;]+;)/);
      cookies.forEach((cookie) => {
        res.headers.append("Set-Cookie", cookie.trim());
      });
    }

    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Vary", "Cookie, Authorization");

    return res;
  } catch (error) {
    console.error("[Passkey Setup Verify Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
