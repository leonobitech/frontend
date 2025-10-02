import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/settings/sessions/revoke-all
 * Revoke all sessions except the current one
 */
export async function POST(request: NextRequest) {
  try {
    // Conectar con backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/sessions/all`,
      {
        method: "DELETE",
        headers: {
          "Cookie": request.headers.get("cookie") || "",
          "x-core-access-key": process.env.CORE_API_KEY || "",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to revoke sessions" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message || "All other sessions revoked successfully",
      revokedCount: data.deletedCount || 0,
    });
  } catch (error) {
    console.error("[Revoke All Sessions Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
