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
 * POST /api/passkey
 * List user's passkeys (changed from GET to POST to send meta in body)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meta: clientMeta } = body;

    // Validate and add server IP to meta
    const ipAddress = extractServerIp(request);
    const parsed = MetaSchema.safeParse(clientMeta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }
    const meta: ClientMeta = { ...parsed.data, ipAddress };

    // Forward to backend with cookies and client headers for authentication
    const response = await fetch(`${process.env.BACKEND_URL}/account/passkey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
        "x-core-access-key": process.env.CORE_API_KEY || "",
        "User-Agent": request.headers.get("user-agent") || "",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "X-Real-IP": request.headers.get("x-real-ip") || "",
      },
      body: JSON.stringify({ meta }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch passkeys" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Passkey List Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/passkey?id=xxx
 * Delete a passkey
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const passkeyId = searchParams.get("id");

    if (!passkeyId) {
      return NextResponse.json(
        { message: "Passkey ID is required" },
        { status: 400 }
      );
    }

    // Parse body to get meta
    const body = await request.json().catch(() => ({}));
    const { meta: clientMeta } = body;

    // Validate and add server IP to meta
    const ipAddress = extractServerIp(request);
    const parsed = MetaSchema.safeParse(clientMeta);
    if (!parsed.success) {
      return NextResponse.json({ message: "Meta inválido" }, { status: 400 });
    }
    const meta: ClientMeta = { ...parsed.data, ipAddress };

    // Forward to backend with client headers
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/passkey/${passkeyId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "User-Agent": request.headers.get("user-agent") || "",
          "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
          "X-Real-IP": request.headers.get("x-real-ip") || "",
        },
        body: JSON.stringify({ meta }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to delete passkey" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Passkey Delete Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
