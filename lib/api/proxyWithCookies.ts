// lib/api/proxyWithCookies.ts
import { NextResponse } from "next/server";
import type { AxiosResponse } from "axios";

export function proxyWithCookies(
  axiosResponse: AxiosResponse,
  statusOverride?: number
) {
  const response = NextResponse.json(axiosResponse.data, {
    status: statusOverride ?? axiosResponse.status,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Vary", "Cookie, Authorization");

  const setCookies = axiosResponse.headers["set-cookie"];
  if (!setCookies) return response;

  const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
  // sin filtros: pasa todo (útil si el backend setea varias cookies de login)
  for (const c of arr) response.headers.append("Set-Cookie", c);
  return response;
}

// Variante con allowlist por nombre (p.ej. solo accessKey y clientKey)
export function proxyWithCookiesAllowlist(
  axiosResponse: AxiosResponse,
  allowedNames: readonly string[],
  statusOverride?: number
) {
  const response = NextResponse.json(axiosResponse.data, {
    status: statusOverride ?? axiosResponse.status,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Vary", "Cookie, Authorization");

  const setCookies = axiosResponse.headers["set-cookie"];
  if (!setCookies) return response;

  const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
  for (const raw of arr) {
    const name = raw.split(";")[0]?.split("=")?.[0]?.trim();
    if (name && allowedNames.includes(name)) {
      response.headers.append("Set-Cookie", raw);
    }
  }
  return response;
}
