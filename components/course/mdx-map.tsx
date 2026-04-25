// ─── Rust Embedded desde Cero — Map de componentes MDX ───
//
// Expone los componentes custom del curso al runtime de MDX.
// Se pasa a <MDXRemote components={courseMdxComponents} /> en CourseContent.
//
// Los 4 componentes pedagógicos (Callout, QuizItem, StepHero, Reflexion)
// cubren los elementos narrativos del curso según brain §7 / §8.
//
// Override de `table`: envuelve cada tabla en un div con overflow-x-auto
// para que tablas anchas puedan scrollear horizontalmente en mobile en vez
// de desbordar el layout.

import type { MDXComponents } from "mdx/types";
import type { HTMLAttributes } from "react";

import { Callout } from "./Callout";
import { CodeFigure } from "./CodeFigure";
import { QuizItem } from "./QuizItem";
import { Reflexion } from "./Reflexion";
import { StepHero } from "./StepHero";

function ResponsiveTable({
  children,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-7 w-full overflow-x-auto rounded-lg border border-[color:var(--course-border)] bg-[color:var(--course-surface)]/30">
      <table className="m-0" {...props}>
        {children}
      </table>
    </div>
  );
}

// Horizontal rule ornamental: `---` en el MDX se renderiza con el glyph ∿
// editorial en el medio en vez de una línea plana, reforzando la identidad
// tech-editorial del curso.
function OrnamentalHr() {
  return <hr className="course-hr" aria-hidden />;
}

// CodeFigure (Client Component) está en ./CodeFigure — reemplaza el <figure>
// nativo de rehype-pretty-code con un wrapper que propaga data-language al
// figure + renderiza el chip de lenguaje y el botón copy.

export const courseMdxComponents: MDXComponents = {
  Callout,
  QuizItem,
  StepHero,
  Reflexion,
  table: ResponsiveTable,
  hr: OrnamentalHr,
  figure: CodeFigure,
};
