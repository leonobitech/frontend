// app/api/settings/remove-avatar/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/settings/remove-avatar
 * Remove user avatar (sets avatar to null in database)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Forward request to backend Core
    const response = await fetch(`${process.env.BACKEND_URL}/account/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": request.headers.get("cookie") || "",
        "x-core-access-key": process.env.CORE_API_KEY || "",
      },
      body: JSON.stringify({
        avatar: null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to remove avatar" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Avatar removed successfully",
    });
  } catch (error) {
    console.error("[Remove Avatar Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
