// File: utils/security/verifyTurnstileToken.ts
import axios from "axios";

interface VerifyTurnstileResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
}

/**
 * Valida el token de Cloudflare Turnstile con su API secreta.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) throw new Error("Missing TURNSTILE_SECRET_KEY env var");

    const res = await axios.post<VerifyTurnstileResult>(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret,
        response: token,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (!res.data.success) return false;

    // Validate hostname to prevent cross-site token reuse
    const hostname = res.data.hostname;
    const expected = "leonobitech.com";
    if (hostname && !hostname.endsWith(expected)) return false;

    return true;
  } catch (error) {
    console.error("Error verifying Turnstile token:", error);
    return false;
  }
}
