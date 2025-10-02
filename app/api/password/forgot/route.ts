import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/password/forgot
 * Request password reset code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Conectar con backend
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/password/forgot`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY || "",
        },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to send reset code" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message || "Reset code sent successfully",
      data: data.data,
    });
  } catch (error) {
    console.error("[Password Forgot Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
