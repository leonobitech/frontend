// types/session.ts
export type SessionContextResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    bio: string | null;
    role: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
  };

  session: {
    id: string;
    createdAt: string;
    updatedAt: string;
    lastUsedAt: string;
    expiresAt: string;
    device: {
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
    };
  };
};

export type ExtendedSessionUser = SessionContextResponse["user"] & {
  displayName: string;
  roleLabel: string;
  isAdmin: boolean;
  isVerified: boolean;
};
