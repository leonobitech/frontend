import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const PIPER_URL = process.env.PIPER_TTS_URL || "http://piper_tts:5000";

const FORWARD_COOKIES = ["accessKey", "clientKey"] as const;

const CONTENT_TYPES: Record<string, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  opus: "audio/ogg",
  ogg: "audio/ogg",
};

const FILE_EXTENSIONS: Record<string, string> = {
  wav: "wav",
  mp3: "mp3",
  opus: "ogg",
  ogg: "ogg",
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    const cookieHeader = allCookies
      .filter((c) =>
        (FORWARD_COOKIES as readonly string[]).includes(c.name)
      )
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    if (!cookieHeader) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.text || typeof body.text !== "string" || body.text.length > 5000) {
      return NextResponse.json(
        { message: "Texto inválido (máx. 5000 caracteres)" },
        { status: 400 }
      );
    }

    const format = body.output_format || "mp3";

    const piperRes = await fetch(`${PIPER_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: body.text,
        output_format: format,
        length_scale: body.length_scale ?? 1.0,
        noise_scale: body.noise_scale ?? 0.667,
        noise_w: body.noise_w ?? 0.8,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!piperRes.ok) {
      const err = await piperRes.text().catch(() => "Piper TTS error");
      return NextResponse.json(
        { message: err },
        { status: piperRes.status }
      );
    }

    const audioBuffer = await piperRes.arrayBuffer();
    const ext = FILE_EXTENSIONS[format] || "mp3";
    const contentType = CONTENT_TYPES[format] || "audio/mpeg";

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="speech.${ext}"`,
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error generando audio";
    return NextResponse.json({ message }, { status: 500 });
  }
}
