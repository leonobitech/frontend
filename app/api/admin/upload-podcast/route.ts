import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// ===== Config =====
const FORWARD_COOKIES = ["accessKey", "clientKey"] as const;
const N8N_WEBHOOK_URL = process.env.N8N_URL;
const N8N_WEBHOOK_KEY = process.env.N8N_WEBHOOK_KEY;

// ===== Tipos utilitarios =====
type CookiePair = { name: string; value: string };
type CookieStore = { getAll(): CookiePair[] };

async function getCookieStore(): Promise<CookieStore> {
  const maybe = cookies() as unknown;
  if (maybe && typeof (maybe as Promise<CookieStore>).then === "function") {
    return (await (maybe as Promise<CookieStore>)) as CookieStore;
  }
  return maybe as CookieStore;
}

function buildCookieHeaderFromPairs(
  pairs: CookiePair[],
  names: readonly string[]
): string | undefined {
  const selected = pairs
    .filter((c) => (names as readonly string[]).includes(c.name))
    .map((c) => `${c.name}=${c.value}`);
  return selected.length ? selected.join("; ") : undefined;
}

export async function POST(request: Request) {
  try {
    // 1) Verify auth cookies exist
    const store = await getCookieStore();
    const cookieHeader = buildCookieHeaderFromPairs(
      store.getAll(),
      FORWARD_COOKIES
    );
    if (!cookieHeader) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    // 2) Verify n8n URL is configured
    if (!N8N_WEBHOOK_URL) {
      console.error("N8N_URL not configured");
      return NextResponse.json(
        { message: "Servicio de upload no configurado" },
        { status: 500 }
      );
    }

    // 3) Parse request body
    const body = await request.json();
    const { userId, title, artist, description, filename, mimeType, fileData } = body;

    // 4) Validate required fields
    if (!userId || !title || !artist || !filename || !mimeType || !fileData) {
      return NextResponse.json(
        { message: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // 5) Validate file type (only MP4 allowed)
    if (mimeType !== "video/mp4") {
      return NextResponse.json(
        { message: "Formato no soportado. Solo se permite MP4." },
        { status: 400 }
      );
    }

    // 6) Forward to n8n webhook
    const n8nResponse = await fetch(`${N8N_WEBHOOK_URL}/webhook/upload-podcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(N8N_WEBHOOK_KEY && { "x-n8n-webhook-key": N8N_WEBHOOK_KEY }),
      },
      body: JSON.stringify({
        userId,
        title,
        artist,
        description,
        filename,
        mimeType,
        fileData,
      }),
    });

    if (!n8nResponse.ok) {
      const errorData = await n8nResponse.json().catch(() => ({}));
      console.error("n8n error:", errorData);
      return NextResponse.json(
        { message: errorData.message || "Error al procesar el video" },
        { status: n8nResponse.status }
      );
    }

    // 7) Return n8n response to client
    const result = await n8nResponse.json();

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      message: "Podcast subido exitosamente",
    });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ message }, { status: 500 });
  }
}
