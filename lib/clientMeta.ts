// File: lib/clientMeta.ts

/** Dispositivo detectado en el cliente */
export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

/** Metadata que espera tu backend */
export interface RequestMeta {
  ipAddress?: string; // se inyecta en la API‐route, no aquí
  deviceInfo: DeviceInfo;
  userAgent: string;
  language: string;
  platform: string;
  timezone: string;
  screenResolution?: string;
  label: string;
  path: string;
  method: string;
  host: string;
}

/**
 * Construye todo menos la IP y la resolución de pantalla.
 * screenResolution y ipAddress se añaden después, en el componente y en la API‐route.
 */
export function buildClientMeta(): Omit<
  RequestMeta,
  "ipAddress" | "screenResolution"
> {
  const ua = navigator.userAgent;

  // 1️⃣ Device
  const device = /Mobi/.test(ua) ? "Mobile" : "Desktop";

  // 2️⃣ Browser: Edge primero, luego Chrome, Firefox, Safari...
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
    ? "Chrome"
    : /Firefox/.test(ua)
    ? "Firefox"
    : /Safari/.test(ua)
    ? "Safari"
    : "Unknown";

  // 3️⃣ OS: Windows, macOS, Linux, Android, iOS...
  const os = /Windows NT/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
    ? "macOS"
    : /Linux/.test(ua)
    ? "Linux"
    : /Android/.test(ua)
    ? "Android"
    : /iP(ad|hone|od)/.test(ua)
    ? "iOS"
    : "Unknown";

  // 4️⃣ Fallback “platform” pondremos el mismo valor que OS
  const platform = os;

  return {
    deviceInfo: { device, browser, os },
    userAgent: ua,
    language: navigator.language,
    platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    label: "",
    path: window.location.pathname,
    method: "POST",
    host: window.location.host,
  };
}
