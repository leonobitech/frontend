import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/settings/profile
 * Update user profile information
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, bio } = body;

    // TODO: Conectar con tu backend
    // Ejemplo de estructura:
    /*
    const response = await fetch(`${process.env.BACKEND_URL}/users/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ name, email, bio }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Failed to update profile" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    */

    // Mock response (remover cuando conectes con backend)
    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        name,
        email,
        bio,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Profile Update Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
