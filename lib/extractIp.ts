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
  // 0️⃣ Cloudflare header (cuando estamos detrás de CF)
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) {
    return normalizeIpAddress(cfIp.trim());
  }

  // 1️⃣ x-forwarded-for (puede llevar varias IPs separadas por coma)
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd
      .split(",")
      .map((chunk) => chunk.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      // Usamos la primera IP, asignada por el proxy de borde (cliente original)
      return normalizeIpAddress(parts[0]);
    }
  }

  // 2️⃣ x-real-ip (algunos proxies lo usan)
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return normalizeIpAddress(realIp.trim());
  }

  // 3️⃣ fallback
  return "0.0.0.0";
}
