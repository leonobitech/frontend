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

    // Conectar con backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/password/change`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": request.headers.get("cookie") || "",
          "x-core-access-key": process.env.CORE_API_KEY || "",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to change password" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message || "Password changed successfully",
      passwordChangedAt: data.passwordChangedAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Password Change Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
