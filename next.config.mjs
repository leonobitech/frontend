/**
 * 🛡️ Configuración avanzada de seguridad en Next.js (NextConfig)
 *
 * Este archivo define una política de seguridad dinámica, sensible al entorno,
 * que se aplica a **todas las rutas del frontend**, y en particular refuerza
 * el endpoint `/api/auth/session`, que implementa bloqueo de IPs privadas en producción.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚙️ Seguridad dinámica basada en entorno:
 *
 * - En desarrollo (`NODE_ENV !== "production"`):
 *    • Se permite 'unsafe-eval' para que React Refresh funcione correctamente
 *    • Se desactivan todos los headers CSP y de seguridad para facilitar el desarrollo
 *
 * - En producción (`NODE_ENV === "production"`):
 *    • Se aplica una CSP estricta:
 *        - Bloquea `eval()` (previene ataques XSS)
 *        - Restringe iframes (`frame-ancestors 'none'`)
 *        - Deshabilita `object-src` (evita plugins embebidos como Flash)
 *        - Controla orígenes para imágenes, scripts y estilos
 *    • Se agregan encabezados HTTP recomendados por OWASP
 *        - Referrer-Policy
 *        - X-Content-Type-Options
 *        - X-Frame-Options
 *        - X-XSS-Protection
 *
 * 🧠 Relación con `/api/auth/session`:
 *    - Esta ruta es protegida adicionalmente por validaciones internas
 *    - Detecta si una IP es privada (`127.0.0.1`, `::1`, `192.168.x.x`, etc.)
 *    - Si se accede desde IP privada en producción real → la request es rechazada
 *
 * IMPORTANTE:
 * Este archivo depende de `process.env.NODE_ENV`.
 * Para asegurar el comportamiento correcto:
 *    → `next dev`  → development (relaja seguridad)
 *    → `next build && next start` → production (aplica seguridad real)
 */

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// 🎯 Política CSP definida por entorno
const ContentSecurityPolicy = isProd
  ? `
  default-src 'self';
  script-src 'self' https://challenges.cloudflare.com 'unsafe-inline';
  connect-src 'self' https://leonobitech.com https://core.leonobitech.com https://challenges.cloudflare.com;
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  frame-src https://challenges.cloudflare.com;
  frame-ancestors 'none';
  base-uri 'self';
  object-src 'none';
`
  : `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com;
  connect-src *;
  img-src * data:;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  frame-src https://challenges.cloudflare.com;
`;

const nextConfig = {
  // 📷 Permitir imágenes remotas de Unsplash (para componentes con `next/image`)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // 🧱 Headers de seguridad HTTP (sólo en producción)
  async headers() {
    if (!isProd) return []; // Dev: sin headers de seguridad para evitar conflictos

    return [
      {
        source: "/(.*)", // 🔐 Aplica a todas las rutas (páginas + API routes)
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
