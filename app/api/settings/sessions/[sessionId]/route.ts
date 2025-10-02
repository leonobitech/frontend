import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

/**
 * DELETE /api/settings/sessions/[sessionId]
 * Revoke a specific session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const allowedCookies = ["accessKey", "clientKey", "clientMeta"];

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookiesToSend: string[] = [];

    for (const { name, value } of allCookies) {
      if (allowedCookies.includes(name)) {
        cookiesToSend.push(`${name}=${value}`);
      }
    }

    const filteredCookieHeader = cookiesToSend.join("; ");
    const requestId = uuidv4();
    const idemKey = `${requestId}:${Date.now()}`;

    // Conectar con backend usando axios
    const response = await axios.delete(
      `${process.env.BACKEND_URL}/account/sessions/${sessionId}`,
      {
        headers: {
          Cookie: filteredCookieHeader,
          "X-Request-ID": requestId,
          "Idempotency-Key": idemKey,
          "x-core-access-key": process.env.CORE_API_KEY || "",
        },
        withCredentials: true,
      }
    );

    const result = NextResponse.json({
      message: response.data.message || "Session revoked successfully",
      sessionId: response.data.sessionId,
    });
    result.headers.set("Cache-Control", "no-store");
    return result;
  } catch (error) {
    console.error("[Session Revoke Error]", error);

    const isAxios = axios.isAxiosError(error);
    const status = isAxios && error.response ? error.response.status : 500;
    const message = isAxios && error.response
      ? error.response.data?.message || error.response.statusText
      : "Internal server error";

    const result = NextResponse.json({ message }, { status });
    result.headers.set("Cache-Control", "no-store");
    return result;
  }
}
