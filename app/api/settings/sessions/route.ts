import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/settings/sessions
 * Get all active sessions for the current user
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    // TODO: Conectar con tu backend
    // Ejemplo de estructura:
    /*
    const response = await fetch(`${process.env.BACKEND_URL}/sessions/active`, {
      headers: {
        "Cookie": request.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Failed to fetch sessions" },
        { status: response.status }
      );
    }

    const sessions = await response.json();
    return NextResponse.json(sessions);
    */

    // Mock response (remover cuando conectes con backend)
    const mockSessions = [
      {
        id: "session-1",
        device: {
          device: "Desktop",
          os: "macOS",
          browser: "Chrome",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0...",
          language: "en-US",
          platform: "MacIntel",
          timezone: "America/New_York",
          screenResolution: "1920x1080",
          label: "Work Computer",
        },
        isRevoked: false,
        isCurrent: true,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        lastUsedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
      {
        id: "session-2",
        device: {
          device: "Mobile",
          os: "iOS",
          browser: "Safari",
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0...",
          language: "en-US",
          platform: "iPhone",
          timezone: "America/New_York",
          screenResolution: "390x844",
          label: "iPhone",
        },
        isRevoked: false,
        isCurrent: false,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastUsedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
    ];

    return NextResponse.json(mockSessions);
  } catch (error) {
    console.error("[Sessions Fetch Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
