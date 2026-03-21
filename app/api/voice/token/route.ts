import { NextRequest, NextResponse } from "next/server";
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";
import { randomUUID } from "crypto";
import { verifyTurnstileToken } from "@/utils/security/verifyTurnstileToken";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// In-memory rate limiting: max 5 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

// Room disconnect secrets: roomName -> { secret, expiresAt }
export const roomSecrets = new Map<string, { secret: string; expiresAt: number }>();
const ROOM_SECRET_TTL_MS = 15 * 60_000; // 15 minutes (matches token TTL)

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

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
  for (const [room, entry] of roomSecrets) {
    if (now > entry.expiresAt) roomSecrets.delete(room);
  }
}, 5 * 60_000);

export async function POST(req: NextRequest) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
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
    canPublishData: true,
    agent: true,
  });

  // Dispatch the voice-assistant agent via RoomConfiguration
  at.roomConfig = new RoomConfiguration({
    agents: [new RoomAgentDispatch({ agentName: "voice-assistant" })],
    departureTimeout: 10,   // Close room 10s after everyone leaves
    maxParticipants: 2,     // Only user + agent
  });

  const token = await at.toJwt();

  // Generate disconnect secret for this room
  const disconnectSecret = randomUUID();
  roomSecrets.set(roomName, {
    secret: disconnectSecret,
    expiresAt: Date.now() + ROOM_SECRET_TTL_MS,
  });

  return NextResponse.json({
    serverUrl: LIVEKIT_URL,
    roomName,
    participantName,
    participantToken: token,
    disconnectSecret,
  });
}
