// frontend/app/api/passkey/recovery/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  requestId: z.string(),
  code: z.string().length(6),
});

/**
 * POST /api/passkey/recovery/verify
 * Verify recovery code and get new pendingToken for setup
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

    const { requestId, code } = parsed.data;

    // Extract traceability headers
    const reqId = request.headers.get("X-Request-ID") || "";
    const idempotencyKey = request.headers.get("Idempotency-Key") || "";

    // Forward to backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/passkey/recovery/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "X-Request-ID": reqId,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ requestId, code }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to verify recovery code" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Passkey Recovery Verify Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
