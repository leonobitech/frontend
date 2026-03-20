import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

export async function POST(req: NextRequest) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { roomName } = await req.json().catch(() => ({ roomName: null }));
  if (!roomName) {
    return NextResponse.json({ error: "roomName required" }, { status: 400 });
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
