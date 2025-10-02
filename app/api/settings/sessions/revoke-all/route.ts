import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/settings/sessions/revoke-all
 * Revoke all sessions except the current one
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Conectar con tu backend
    // Ejemplo de estructura:
    /*
    const response = await fetch(
      `${process.env.BACKEND_URL}/sessions/revoke-all`,
      {
        method: "POST",
        headers: {
          "Cookie": request.headers.get("cookie") || "",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Failed to revoke sessions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    */

    // Mock response (remover cuando conectes con backend)
    return NextResponse.json({
      message: "All other sessions revoked successfully",
      revokedCount: 2,
    });
  } catch (error) {
    console.error("[Revoke All Sessions Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
