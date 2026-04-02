// app/api/auth/verify-magic-link/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import axios from "axios";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const VerifyMagicLinkSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  requestId: z.string().min(1, "Request ID requerido"),
});

function jsonNoStore<T>(body: T, status: number) {
  const r = NextResponse.json<T>(body, { status });
  r.headers.set("Cache-Control", "no-store");
  r.headers.set("Vary", "Cookie, Authorization");
  return r;
}

export async function POST(request: NextRequest) {
  // 1) Parseo y validación
  const body = await request.json();
  const parsed = VerifyMagicLinkSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore(
      {
        message: "Datos inválidos",
        issues:
          process.env.NODE_ENV === "development"
            ? parsed.error.flatten()
            : undefined,
      },
      422
    );
  }

  const { token, requestId: rid } = parsed.data;

  // 2) Trazabilidad
  const traceId = request.headers.get("X-Request-ID") ?? uuidv4();

  try {
    // 3) Proxy al backend
    const apiRes = await axios.post(
      `${process.env.BACKEND_URL}/account/auth/verify-magic-link`,
      { token, requestId: rid },
      {
        headers: {
          "Content-Type": "application/json",
          "x-core-access-key": process.env.CORE_API_KEY,
          "X-Request-ID": traceId,
          "Cache-Control": "no-store",
        },
        validateStatus: () => true,
        timeout: 15000,
      }
    );

    return jsonNoStore(apiRes.data, apiRes.status);
  } catch (err: unknown) {
    const status =
      axios.isAxiosError(err) && err.response ? err.response.status : 500;
    const message =
      axios.isAxiosError(err) && err.response
        ? err.response.data?.message || err.response.statusText
        : err instanceof Error
        ? err.message
        : "Error al verificar magic link";
    return jsonNoStore({ message }, status);
  }
}
