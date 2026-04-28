// ─── Rust Embedded desde Cero — Layout (público, sin auth gate) ───
//
// Server component. NO requiere auth — el curso es gratuito y queremos que
// Google crawlee el contenido + que cualquier visitante pueda compartir la URL
// y abrirla sin fricción. La experiencia progresiva:
//
//   - Anonymous:  lee el curso completo + toma el assessment (scoring
//                 client-side). No puede "marcar como completada" ni reclamar
//                 certificado — esas features requieren cuenta.
//   - Logueado:   lo mismo + auto-enrollment silencioso + progress tracking +
//                 certificado al aprobar el assessment.
//
// El trigger del auto-enroll vive en <AutoEnroll /> (Client Component chico
// que corre useEffect una vez y no renderiza nada). Así el layout queda
// Server y gana el render estático.

import type { ReactNode } from "react";

import { rustConfig } from "@/lib/course-config/configs/rust";
import { CourseConfigProvider } from "@/lib/course-config/context";

import { AutoEnroll } from "./_components/AutoEnroll";

interface Props {
  children: ReactNode;
}

export default function RustCourseLayout({ children }: Props) {
  return (
    <CourseConfigProvider courseSlug={rustConfig.courseSlug}>
      <AutoEnroll />
      {children}
    </CourseConfigProvider>
  );
}
