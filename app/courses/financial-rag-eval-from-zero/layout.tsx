// ─── Financial RAG Evaluation Suite — Layout (público, sin auth gate) ───
//
// Server component. NO requiere auth — el curso es gratuito y queremos que
// Google crawlee el contenido + que cualquier visitante pueda compartir la URL
// y abrirla sin fricción. Mismo patrón que rust-embedded.
//
// El trigger del auto-enroll vive en <AutoEnroll /> (Client Component chico
// que corre useEffect una vez y no renderiza nada).

import type { ReactNode } from "react";

import { financebenchConfig } from "@/lib/course-config/configs/financebench";
import { CourseConfigProvider } from "@/lib/course-config/context";

import { AutoEnroll } from "./_components/AutoEnroll";

interface Props {
  children: ReactNode;
}

export default function FinancebenchCourseLayout({ children }: Props) {
  return (
    <CourseConfigProvider courseSlug={financebenchConfig.courseSlug}>
      <AutoEnroll />
      {children}
    </CourseConfigProvider>
  );
}
