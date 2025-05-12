import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const accessKey = req.cookies.get("accessKey")?.value;
  const clientKey = req.cookies.get("clientKey")?.value;

  if (!accessKey || !clientKey) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const blocked = ["/login", "/register", "/verify-email"];

  const isBlocked = blocked.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isBlocked) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/verify-email",
    "/login/(.*)",
    "/register/(.*)",
    "/verify-email/(.*)",
  ],
};
