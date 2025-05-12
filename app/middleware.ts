// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const accessKey = req.cookies.get("accessKey")?.value;
  const clientKey = req.cookies.get("clientKey")?.value;

  if (!accessKey || !clientKey) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // ⛔ Rutas públicas que no deben ser accesibles si ya hay sesión
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

// ✅ Aplica solo a rutas públicas
export const config = {
  matcher: ["/login", "/register", "/verify-email/:path*"],
};
