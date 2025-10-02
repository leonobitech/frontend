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

    // TODO: Conectar con tu backend
    // Ejemplo de estructura:
    /*
    const response = await fetch(
      `${process.env.BACKEND_URL}/sessions/${sessionId}/revoke`,
      {
        method: "DELETE",
        headers: {
          "Cookie": request.headers.get("cookie") || "",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Failed to revoke session" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    */

    // Mock response (remover cuando conectes con backend)
    return NextResponse.json({
      message: "Session revoked successfully",
      sessionId,
    });
  } catch (error) {
    console.error("[Session Revoke Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
