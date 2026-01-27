// proxy.ts - Next.js 16 Proxy for route protection
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const accessKey = req.cookies.get("accessKey")?.value;
  const clientKey = req.cookies.get("clientKey")?.value;

  const { pathname, search } = req.nextUrl;

  // Rutas que solo debería ver un usuario NO autenticado
  const authPages = ["/login", "/register", "/verify-email"];
  const isAuthPage = authPages.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Rutas protegidas (requieren sesión) - páginas
  const protectedPages = ["/leonobit", "/iot"];
  const isProtectedPage = protectedPages.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Rutas API protegidas (requieren sesión)
  const protectedApis = ["/api/iot", "/api/admin"];
  const isProtectedApi = protectedApis.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isLoggedIn = Boolean(accessKey && clientKey);

  // 1) Si está logueado y visita páginas de auth -> redirige al dashboard
  if (isLoggedIn && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 2) Si NO está logueado e intenta acceder a APIs protegidas -> 401 JSON
  if (!isLoggedIn && isProtectedApi) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  // 3) Si NO está logueado e intenta acceder a páginas protegidas -> a login
  if (!isLoggedIn && isProtectedPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Solo aplicamos middleware donde hace falta (evita afectar assets/_next)
export const config = {
  matcher: [
    // páginas de auth
    "/login",
    "/register",
    "/verify-email",
    "/login/(.*)",
    "/register/(.*)",
    "/verify-email/(.*)",

    // páginas protegidas
    "/leonobit",
    "/leonobit/(.*)",
    "/iot",
    "/iot/(.*)",

    // APIs protegidas
    "/api/iot/(.*)",
    "/api/admin/(.*)",
  ],
};
