import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { generateDisconnectSecret } from "../token/route";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export async function POST(req: NextRequest) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { roomName, disconnectSecret } = await req.json().catch(() => ({ roomName: null, disconnectSecret: null }));

  if (!roomName || !disconnectSecret) {
    return NextResponse.json({ error: "roomName and disconnectSecret required" }, { status: 400 });
  }

  // Verify HMAC-based disconnect secret (stateless, no storage needed)
  const expected = generateDisconnectSecret(roomName);
  if (disconnectSecret !== expected) {
    return NextResponse.json({ error: "Invalid disconnect credentials" }, { status: 403 });
  }

  try {
    const host = LIVEKIT_URL.replace("wss://", "https://");
    const client = new RoomServiceClient(host, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    await client.deleteRoom(roomName);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // room may already be closed
  }
}
