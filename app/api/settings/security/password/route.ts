import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/settings/security/password
 * Change user password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validaciones básicas
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // TODO: Conectar con tu backend
    // Ejemplo de estructura:
    /*
    const response = await fetch(
      `${process.env.BACKEND_URL}/users/password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": request.headers.get("cookie") || "",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Failed to change password" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    */

    // Mock response (remover cuando conectes con backend)
    return NextResponse.json({
      message: "Password changed successfully",
      passwordChangedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Password Change Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
