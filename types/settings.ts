import { SessionContextResponse } from "./sessions";

// Profile types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string | null;
  role: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Active Sessions types
export interface ActiveSession {
  id: string;
  device: SessionDevice;
  isRevoked: boolean;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export interface SessionDevice {
  device: string;
  os: string;
  browser: string;
  ipAddress: string;
  userAgent: string;
  language: string;
  platform: string;
  timezone: string;
  screenResolution: string;
  label: string;
}

// Security types
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string | null;
  loginAlerts: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// API Response types
export interface SettingsResponse {
  profile: UserProfile;
  sessions: ActiveSession[];
  security: SecuritySettings;
}

// Convert session context to settings format
export function sessionToProfile(
  sessionData: SessionContextResponse
): UserProfile {
  return sessionData.user;
}

export function sessionToActiveSession(
  sessionData: SessionContextResponse,
  isCurrent: boolean = true
): ActiveSession {
  return {
    id: sessionData.session.id,
    device: sessionData.session.device,
    isRevoked: sessionData.session.isRevoked,
    isCurrent,
    createdAt: sessionData.session.createdAt,
    lastUsedAt: sessionData.session.lastUsedAt,
    expiresAt: sessionData.session.expiresAt,
  };
}
