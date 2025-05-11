// File: middleware.ts
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const accessKey = req.cookies.get("accessKey")?.value;
  const clientKey = req.cookies.get("clientKey")?.value;

  // ⛔ Si no hay cookies, dejamos pasar
  if (!accessKey || !clientKey) return NextResponse.next();

  // ✅ Hay cookies = posiblemente autenticado → redirigir
  const { pathname } = req.nextUrl;
  const blocked = ["/login", "/register", "/verify-email"];

  const cleanPath = pathname.replace(/\/+$/, ""); // quita `/` final
  if (blocked.includes(cleanPath)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 👇 Esta es la parte que configura el matcher
export const config = {
  matcher: ["/login", "/register", "/verify-email"],
};
