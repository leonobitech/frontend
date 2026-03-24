/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const ContentSecurityPolicy = isProd
  ? `
  default-src 'self';
  script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com 'unsafe-inline';
  connect-src 'self'
    https://leonobitech.com
    https://core.leonobitech.com
    https://odoo-mcp.leonobitech.com
    https://n8n.leonobitech.com
    https://challenges.cloudflare.com
    https://cloudflareinsights.com
    wss://core.leonobitech.com
    https://*.livekit.cloud
    wss://*.livekit.cloud
    https://lk.leonobitech.com
    wss://lk.leonobitech.com;
  img-src 'self' data: blob: https://leonobitech.com https://br.leonobitech.com;
  media-src 'self' https://leonobitech.com https://br.leonobitech.com blob:;
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
  img-src * data: blob:;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  frame-src https://challenges.cloudflare.com;
`;

const nextConfig = {
  turbopack: {
    root: ".",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "br.leonobitech.com" },
      { protocol: "https", hostname: "leonobitech.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/gallery/:path*", destination: "/", permanent: true },
      { source: "/gallery", destination: "/", permanent: true },
      { source: "/projects/:path*", destination: "/", permanent: true },
      { source: "/projects", destination: "/", permanent: true },
      { source: "/podcasts/:path*", destination: "/", permanent: true },
      { source: "/podcasts", destination: "/", permanent: true },
      { source: "/blog/:path*", destination: "/", permanent: true },
      { source: "/blog", destination: "/", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
      { source: "/about", destination: "/", permanent: true },
      { source: "/careers", destination: "/", permanent: true },
      { source: "/community", destination: "/", permanent: true },
      { source: "/docs", destination: "/", permanent: true },
      { source: "/help", destination: "/", permanent: true },
      { source: "/iot/:path*", destination: "/", permanent: true },
      { source: "/iot", destination: "/", permanent: true },
      { source: "/tts", destination: "/", permanent: true },
      { source: "/mcp-connectors/:path*", destination: "/", permanent: true },
      { source: "/mcp-connectors", destination: "/", permanent: true },
    ];
  },
  async headers() {
    if (!isProd) return [];
    return [
      {
        source: "/(.*)",
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
            value: "camera=(), microphone=(self), geolocation=()",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
