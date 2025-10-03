import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/passkey
 * List user's passkeys
 */
export async function GET(request: NextRequest) {
  try {
    // Forward to backend with cookies and client headers for authentication
    const response = await fetch(`${process.env.BACKEND_URL}/account/passkey`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
        "x-core-access-key": process.env.CORE_API_KEY || "",
        "User-Agent": request.headers.get("user-agent") || "",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "X-Real-IP": request.headers.get("x-real-ip") || "",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to fetch passkeys" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Passkey List Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/passkey?id=xxx
 * Delete a passkey
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const passkeyId = searchParams.get("id");

    if (!passkeyId) {
      return NextResponse.json(
        { message: "Passkey ID is required" },
        { status: 400 }
      );
    }

    // Forward to backend with client headers
    const response = await fetch(
      `${process.env.BACKEND_URL}/account/passkey/${passkeyId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
          "x-core-access-key": process.env.CORE_API_KEY || "",
          "User-Agent": request.headers.get("user-agent") || "",
          "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
          "X-Real-IP": request.headers.get("x-real-ip") || "",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to delete passkey" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Passkey Delete Error]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
