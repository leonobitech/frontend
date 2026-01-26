import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

/**
 * Check if user has valid session cookies
 * Returns null if authenticated, or a 401 response if not
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const accessKey = cookieStore.get("accessKey")?.value;
  const clientKey = cookieStore.get("clientKey")?.value;

  if (!accessKey || !clientKey) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Helper to forward authentication cookies to backend
 * Used by all IoT API routes
 */
export async function getForwardHeaders(request: NextRequest) {
  const allowedCookies = ["accessKey", "clientKey", "clientMeta"];
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookiesToSend: string[] = [];

  for (const { name, value } of allCookies) {
    if (allowedCookies.includes(name)) {
      cookiesToSend.push(`${name}=${value}`);
    }
  }

  const requestId = uuidv4();
  return {
    "Content-Type": "application/json",
    Cookie: cookiesToSend.join("; "),
    "X-Request-ID": requestId,
    "Idempotency-Key": `${requestId}:${Date.now()}`,
    "x-core-access-key": process.env.CORE_API_KEY || "",
    "User-Agent": request.headers.get("user-agent") || "",
  };
}
