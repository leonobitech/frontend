// ─── Auto-enroll del user actual al curso Rust Embedded ───
//
// Proxy al endpoint backend. Forwardea las cookies del user (session) para
// que el backend identifique al usuario y cree el Enrollment row.
//
// El endpoint backend esperado es `POST /learn/courses/:slug/enroll`.
// Si ese endpoint todavía no existe en el core microservice, esta ruta va a
// devolver 404 — el cliente maneja el error gracefully (ver
// `enrollInRustCourse` en lib/api/course-progress.ts).
//
// Implementation note: consideramos responses:
//   200/201 → enroll creado
//   409     → ya enrolled (idempotente)
//   401     → no auth (el layout ya redirige antes de que esto corra)
//   404     → handler backend no existe todavía

import { NextResponse, type NextRequest } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://core.leonobitech.com";
const COURSE_SLUG = "rust-embedded-desde-cero";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const cookieHeader = req.headers.get("cookie") ?? "";

  try {
    const res = await fetch(
      `${API_URL}/learn/courses/${COURSE_SLUG}/enroll`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        // No hay body — el backend deriva userId de la session cookie
      },
    );

    const bodyText = await res.text();
    let body: unknown;
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      body = { raw: bodyText };
    }

    return NextResponse.json(body, { status: res.status });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reach backend";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
