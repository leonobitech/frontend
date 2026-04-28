// ─── Financial RAG Evaluation Suite — Auto-enroll silencioso ───
//
// Mismo contrato que `app/courses/rust-embedded-desde-cero/_components/AutoEnroll.tsx`.
// Reusa el mismo endpoint del backend (que es agnóstico de curso) — si el
// user tiene sesión, llama al endpoint de enrollment para crearse el row
// (idempotente: si ya está enrolled, 409 → noop).

"use client";

import { useEffect } from "react";

import { enrollInRustCourse } from "@/lib/api/course-progress";

export function AutoEnroll() {
  useEffect(() => {
    // Fire-and-forget. No awaited — no bloquea render ni hydration.
    // TODO: cuando el endpoint de enrollment soporte course slug, pasarle
    // "financial-rag-eval-from-zero". Hoy reusa el de rust por compat.
    void enrollInRustCourse();
  }, []);

  return null;
}
