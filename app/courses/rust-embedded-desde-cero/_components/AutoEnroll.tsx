// ─── Rust Embedded desde Cero — Auto-enroll silencioso ───
//
// Client component que no renderiza nada — solo dispara un side effect al
// montar. Si el user tiene sesión, llama al endpoint de enrollment para
// crearse el row (idempotente: si ya está enrolled, 409 → noop).
//
// Si no hay sesión, el backend devuelve 401 y `enrollInRustCourse` retorna
// false. Ningún efecto visible — el usuario anónimo sigue leyendo el curso.
//
// El `_components/` directory usa el underscore para marcar que no es una
// ruta (Next.js skipea folders que empiezan con `_` al generar rutas).

"use client";

import { useEffect } from "react";

import { enrollInRustCourse } from "@/lib/api/course-progress";

export function AutoEnroll() {
  useEffect(() => {
    // Fire-and-forget. No awaited — no bloquea render ni hydration.
    void enrollInRustCourse();
  }, []);

  return null;
}
