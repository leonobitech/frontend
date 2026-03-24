import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { randomUUID, createHmac } from "crypto";
import { verifyTurnstileToken } from "@/utils/security/verifyTurnstileToken";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const DISCONNECT_SECRET_KEY = process.env.DISCONNECT_SECRET;
const BOT_DISPATCH_URL = process.env.BOT_DISPATCH_URL;
const BOT_API_KEY = process.env.BOT_API_KEY;

// In-memory rate limiting: max 5 requests per IP per minute
// Note: per-instance on Vercel, not globally shared
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Generate HMAC-based disconnect secret from roomName.
 * Stateless — no storage needed, works across all Vercel instances.
 */
export function generateDisconnectSecret(roomName: string): string {
  if (!DISCONNECT_SECRET_KEY) throw new Error("DISCONNECT_SECRET not configured");
  return createHmac("sha256", DISCONNECT_SECRET_KEY)
    .update(roomName)
    .digest("hex");
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

export async function POST(req: NextRequest) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL || !DISCONNECT_SECRET_KEY || !BOT_DISPATCH_URL) {
    return NextResponse.json(
      { error: "LiveKit not configured" },
      { status: 500 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  // Verify Turnstile CAPTCHA server-side
  const body = await req.json().catch(() => ({}));
  const turnstileToken = body.turnstileToken;

  if (!turnstileToken || typeof turnstileToken !== "string") {
    return NextResponse.json(
      { error: "CAPTCHA verification required" },
      { status: 403 }
    );
  }

  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return NextResponse.json(
      { error: "CAPTCHA verification failed" },
      { status: 403 }
    );
  }

  const roomName = `demo-${randomUUID()}`;
  const participantName = `user-${randomUUID().slice(0, 8)}`;

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
    name: participantName,
    ttl: "15m",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  // Dispatch bot into the room via Pipecat HTTP endpoint
  try {
    const botRes = await fetch(`${BOT_DISPATCH_URL}/bot/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Api-Key": BOT_API_KEY || "",
      },
      body: JSON.stringify({ room_name: roomName }),
    });
    if (!botRes.ok) {
      const err = await botRes.text();
      console.error("Bot dispatch failed:", err);
      return NextResponse.json({ error: "Failed to start voice agent" }, { status: 502 });
    }
  } catch (err) {
    console.error("Bot dispatch error:", err);
    return NextResponse.json({ error: "Voice agent unavailable" }, { status: 503 });
  }

  // HMAC-based disconnect secret: stateless, works across all Vercel instances
  const disconnectSecret = generateDisconnectSecret(roomName);

  return NextResponse.json({
    roomName,
    participantName,
    participantToken: token,
    disconnectSecret,
  });
}
