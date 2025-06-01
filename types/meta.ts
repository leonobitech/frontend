// types/meta.ts
export type ClientMeta = {
  deviceInfo: {
    device: string;
    os: string;
    browser: string;
  };
  userAgent: string;
  language: string;
  platform: string;
  timezone: string;
  screenResolution: string;
  label: string;
  ipAddress: string; // ¡También incluyamos la IP!
};
