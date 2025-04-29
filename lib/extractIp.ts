// File: lib/extractIp.ts

/**
 * Normaliza IPv6‐mapped IPv4 (::ffff:…) → 192.168.0.1
 */
export function normalizeIpAddress(ip: string): string {
  if (!ip) return "0.0.0.0";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

/**
 * Extrae la IP real de un Request:
 *   ‣ Primero mira x-forwarded-for
 *   ‣ Luego x-real-ip (si tu proxy lo expone)
 *   ‣ Si no hay ninguno, devuelve "0.0.0.0"
 */

export function extractServerIp(req: Request): string {
  // 1️⃣ x-forwarded-for (puede llevar varias IPs separadas por coma)
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    return normalizeIpAddress(fwd.split(",")[0].trim());
  }

  // 2️⃣ x-real-ip (algunos proxies lo usan)
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return normalizeIpAddress(realIp.trim());
  }

  // 3️⃣ fallback
  return "0.0.0.0";
}
