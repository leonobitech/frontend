import { NextRequest, NextResponse } from "next/server";

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

    // Conectar con backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/sessions/${sessionId}`,
      {
        method: "DELETE",
        headers: {
          "Cookie": request.headers.get("cookie") || "",
          "X-API-Key": process.env.CORE_API_KEY || "",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to revoke session" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message || "Session revoked successfully",
      sessionId: data.sessionId,
    });
  } catch (error) {
    console.error("[Session Revoke Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
