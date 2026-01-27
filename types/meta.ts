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
  ipAddress: string;
  // 🔐 Security fields - bind to session and add expiry
  sessionId?: string;  // Bound to authenticated session
  createdAt?: number;  // Timestamp for expiry validation (15-20 min TTL)
};
