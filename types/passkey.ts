/**
 * Passkey types for frontend
 */

export interface Passkey {
  id: string;
  name: string | null;
  device: {
    device: string;
    os: string;
    browser: string;
  } | null;
  transports: string[];
  createdAt: string;
  lastUsedAt: string;
}

export interface PasskeyRegisterChallengeResponse {
  message: string;
  options: {
    challenge: string;
    rp: {
      name: string;
      id: string;
    };
    user: {
      id: string;
      name: string;
      displayName: string;
    };
    pubKeyCredParams: Array<{
      type: "public-key";
      alg: number;
    }>;
    timeout: number;
    attestation: "none" | "indirect" | "direct";
    authenticatorSelection: {
      authenticatorAttachment?: "platform" | "cross-platform";
      requireResidentKey: boolean;
      residentKey: "discouraged" | "preferred" | "required";
      userVerification: "required" | "preferred" | "discouraged";
    };
    excludeCredentials?: Array<{
      id: string;
      type: "public-key";
      transports?: string[];
    }>;
  };
}

export interface PasskeyRegisterVerifyResponse {
  message: string;
  passkey: {
    id: string;
    name: string | null;
    createdAt: string;
  };
}

export interface PasskeyLoginChallengeResponse {
  message: string;
  options: {
    challenge: string;
    timeout: number;
    rpId: string;
    allowCredentials?: Array<{
      type: "public-key";
      id: string;
      transports?: string[];
    }>;
    userVerification: "required" | "preferred" | "discouraged";
  };
}

export interface PasskeyLoginVerifyResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  session: {
    id: string;
    expiresAt: string;
  };
}

export interface PasskeyListResponse {
  message: string;
  passkeys: Passkey[];
}

export interface PasskeyDeleteResponse {
  message: string;
  passkeyId: string;
}
