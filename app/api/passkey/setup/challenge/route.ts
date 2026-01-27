// frontend/app/api/passkey/setup/challenge/route.ts

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
  meta: MetaSchema,
});

/**
 * POST /api/passkey/setup/challenge
 * Generate passkey setup challenge (cross-platform ONLY)
 * For first-time passkey setup after login
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

    const { pendingToken, meta: clientMeta } = parsed.data;

    // Extract traceability headers
    const requestId = request.headers.get("X-Request-ID") || "";
    const idempotencyKey = request.headers.get("Idempotency-Key") || "";

    // Add server IP to meta
    const ipAddress = extractServerIp(request);
    const meta: ClientMeta = { ...clientMeta, ipAddress };

    // Forward to backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/passkey/setup/challenge`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "X-Request-ID": requestId,
          "Idempotency-Key": idempotencyKey,
          "User-Agent": meta.userAgent,
        },
        body: JSON.stringify({ pendingToken, meta }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to generate setup challenge" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Passkey Setup Challenge Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
