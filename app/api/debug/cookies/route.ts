// app/api/debug/cookies/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const hasAccessKey = allCookies.some((c) => c.name === "accessKey");
    const hasClientKey = allCookies.some((c) => c.name === "clientKey");

    return NextResponse.json({
      hasAccessKey,
      hasClientKey,
      cookieCount: allCookies.length,
      isAuthenticated: hasAccessKey && hasClientKey,
    });
  } catch {
    return NextResponse.json(
      {
        hasAccessKey: false,
        hasClientKey: false,
        cookieCount: 0,
        isAuthenticated: false,
      },
      { status: 500 }
    );
  }
}
