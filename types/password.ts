/**
 * Types for password reset flow
 */

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  data: {
    email: string;
    requestId: string;
    expiresIn: number;
    codeSent: boolean;
  };
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
  requestId: string;
}

export interface ResetPasswordResponse {
  message: string;
  data?: {
    userId: string;
    email: string;
    sessionId?: string;
  };
  resend?: boolean;
  requestId?: string;
  expiresIn?: number;
}
