import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/settings/profile
 * Update user profile information
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, bio } = body;

    // Conectar con backend
    const response = await fetch(`${process.env.BACKEND_URL}/account/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": request.headers.get("cookie") || "",
        "x-core-access-key": process.env.CORE_API_KEY || "",
      },
      body: JSON.stringify({ name, email, bio }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to update profile" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message || "Profile updated successfully",
      user: data.user,
    });
  } catch (error) {
    console.error("[Profile Update Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
