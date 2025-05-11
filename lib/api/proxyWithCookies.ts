// File: lib/api/proxyWithCookies.ts
import { NextResponse } from "next/server";
import type { AxiosResponse } from "axios";

export function proxyWithCookies(
  axiosResponse: AxiosResponse,
  statusOverride?: number
) {
  const response = NextResponse.json(axiosResponse.data, {
    status: statusOverride ?? axiosResponse.status,
  });

  // ✅ Detectamos si el backend mandó cookies nuevas
  const setCookies = axiosResponse.headers["set-cookie"];
  const hasNewCookies =
    !!setCookies &&
    ((Array.isArray(setCookies) && setCookies.length > 0) ||
      typeof setCookies === "string");

  if (hasNewCookies) {
    // 🔥 Limpiamos cookies existentes del response previo
    const existing = response.headers.getSetCookie?.() ?? [];
    for (const c of existing) {
      const name = c.split("=")[0];
      response.cookies.delete(name);
    }

    // 🍪 Establecemos las cookies nuevas
    if (Array.isArray(setCookies)) {
      setCookies.forEach((c) => response.headers.append("Set-Cookie", c));
    } else if (typeof setCookies === "string") {
      response.headers.set("Set-Cookie", setCookies);
    }
  }

  return response;
}
