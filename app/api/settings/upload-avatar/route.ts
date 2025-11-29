// app/api/settings/upload-avatar/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

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
    const { userId, filename, mimeType, fileData } = body;

    // 4) Validate required fields
    if (!userId || !filename || !mimeType || !fileData) {
      return NextResponse.json(
        { message: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    // 5) Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { message: "Formato de imagen no soportado. Usa JPG, PNG o WebP." },
        { status: 400 }
      );
    }

    // 6) Forward to n8n webhook using axios
    const n8nResponse = await axios.post(
      `${N8N_WEBHOOK_URL}/webhook/upload-avatar`,
      {
        userId,
        filename,
        mimeType,
        fileData,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(N8N_WEBHOOK_KEY && { "x-n8n-webhook-key": N8N_WEBHOOK_KEY }),
        },
        timeout: 60_000, // 1 minute for images
        validateStatus: () => true,
      }
    );

    if (n8nResponse.status >= 400) {
      console.error("n8n error:", n8nResponse.data);
      return NextResponse.json(
        { message: n8nResponse.data?.message || "Error al subir el avatar" },
        { status: n8nResponse.status }
      );
    }

    // 7) Return n8n response to client
    return NextResponse.json({
      success: true,
      avatarUrl: n8nResponse.data.avatarUrl,
      message: "Avatar subido exitosamente",
    });
  } catch (err) {
    console.error("Upload error:", err);
    const status =
      axios.isAxiosError(err) && err.response ? err.response.status : 500;
    const message =
      axios.isAxiosError(err) && err.response
        ? err.response.data?.message || err.response.statusText
        : err instanceof Error
        ? err.message
        : "Error desconocido";

    return NextResponse.json({ message }, { status });
  }
}
