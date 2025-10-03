// File: lib/clientMeta.ts
import * as UAParser from "ua-parser-js";

/** Dispositivo detectado en el cliente */
export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
}

/** Metadata que espera tu backend */
export interface RequestMeta {
  ipAddress?: string; // se inyecta en la API‐route (server)
  deviceInfo: DeviceInfo;
  userAgent: string;
  language: string; // p.ej. "es,es-ES;q=0.9"
  platform: string; // usamos el OS como “platform” para alinear logs
  timezone: string; // p.ej. "America/Buenos_Aires"
  screenResolution?: string; // la agrega el componente (client)
  label: string; // útil para taggear origen (p.ej. "ws-ticket")
  path: string; // window.location.pathname
  method: string; // "POST" o lo que corresponda
  host: string; // window.location.host
}

/** Devuelve true si estamos en cliente (browser) */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

/**
 * Extrae el deviceInfo del navegador con ua-parser-js y correcciones manuales.
 * En SSR devuelve valores seguros.
 */
export function getDeviceInfo(): DeviceInfo {
  if (!isBrowser()) {
    return { device: "Desktop", os: "Unknown", browser: "Unknown" };
  }

  const parser = new UAParser.UAParser();
  const result = parser.getResult();
  const ua = navigator.userAgent;

  let browser = result.browser.name || "Unknown";

  // 🔍 Correcciones manuales (alineadas con backend)
  if (ua.includes("EdgA")) {
    browser = "Edge Mobile";
  } else if (ua.includes("EdgiOS")) {
    browser = "Edge iOS";
  } else if (ua.includes("Edg/")) {
    browser = "Edge";
  } else if (ua.includes("Brave")) {
    browser = "Brave";
  } else if (ua.includes("Vivaldi")) {
    browser = "Vivaldi";
  } else if (ua.includes("OPR/")) {
    browser = "Opera";
  }

  let os = result.os.name || "Unknown";

  // Simplificar nombres de OS
  if (os.includes("Mac OS")) {
    os = "macOS";
  } else if (os.includes("Windows")) {
    os = "Windows";
  } else if (os.includes("Linux")) {
    os = "Linux";
  } else if (os.includes("Android")) {
    os = "Android";
  } else if (os.includes("iOS")) {
    os = "iOS";
  }

  return {
    device: result.device.type || "Desktop",
    os,
    browser,
  };
}

/**
 * Construye meta base en cliente (sin ipAddress ni screenResolution).
 * En SSR devuelve valores seguros.
 */
export function buildClientMetaBase(): Omit<
  RequestMeta,
  "ipAddress" | "screenResolution"
> {
  if (!isBrowser()) {
    // Valores seguros para SSR
    return {
      deviceInfo: { device: "Desktop", os: "Unknown", browser: "Unknown" },
      userAgent: "unknown",
      language: "en",
      platform: "Unknown",
      timezone: "",
      label: "",
      path: "/",
      method: "POST",
      host: "localhost",
    };
  }

  const deviceInfo = getDeviceInfo();
  let ua = "unknown";
  let languages = "en";

  if (typeof navigator !== "undefined") {
    ua = navigator.userAgent || "unknown";
    languages = Array.isArray(navigator.languages)
      ? navigator.languages.join(",")
      : navigator.language || "en";
  }

  return {
    deviceInfo,
    userAgent: ua,
    language: languages,
    platform: deviceInfo.os, // mismo OS como platform, para alinear con logs del Core
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    label: "",
    path: window.location.pathname,
    method: "POST",
    host: window.location.host,
  };
}

/**
 * Helper opcional: agrega screenResolution al meta base (sigue sin ipAddress).
 */
export function buildClientMetaWithResolution(
  screenResolution: string,
  overrides?: Partial<Omit<RequestMeta, "ipAddress">>
): Omit<RequestMeta, "ipAddress"> {
  const base = buildClientMetaBase();
  return {
    ...base,
    screenResolution,
    ...(overrides ?? {}),
  };
}
