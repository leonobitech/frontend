import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/settings/sessions
 * Get all active sessions for the current user
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    // Conectar con backend
    const response = await fetch(`${process.env.BACKEND_URL}/account/sessions`, {
      method: "GET",
      headers: {
        "Cookie": request.headers.get("cookie") || "",
        "X-API-Key": process.env.CORE_API_KEY || "",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch sessions" },
        { status: response.status }
      );
    }

    // El backend devuelve: { sessions: [...], totalDevices, activeDevices }
    // Mapear las sesiones al formato esperado por el frontend
    const sessions = data.sessions?.map((session: any) => ({
      id: session.id,
      device: session.device,
      isRevoked: session.isRevoked,
      isCurrent: session.isCurrent,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
    })) || [];

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[Sessions Fetch Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
