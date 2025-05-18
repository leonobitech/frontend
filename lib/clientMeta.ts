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
 * Extrae el deviceInfo del navegador con ua-parser-js y correcciones manuales
 */
export function getDeviceInfo(): DeviceInfo {
  const parser = new UAParser.UAParser();
  const result = parser.getResult();
  const ua = navigator.userAgent;

  let browser = result.browser.name || "Unknown";

  // 🔍 Correcciones manuales igual que en backend
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

  const os =
    result.os.name && result.os.version
      ? `${result.os.name} ${result.os.version}`
      : result.os.name || "Unknown";

  return {
    device: result.device.type || "Desktop",
    os,
    browser,
  };
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
  const deviceInfo = getDeviceInfo();

  return {
    deviceInfo,
    userAgent: ua,
    language: navigator.language,
    platform: deviceInfo.os, // Usamos el mismo OS como platform
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    label: "",
    path: window.location.pathname,
    method: "POST",
    host: window.location.host,
  };
}
