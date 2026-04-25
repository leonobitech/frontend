// ─── Rust Embedded desde Cero — Tabla de contenidos del paso ───
//
// Manual editorial §2: el TOC es la espina dorsal navegacional.
// - H2 prominente (peso semibold, sin indentación, color foreground)
// - H3 indentado, peso regular, color soft
// - Active state: accent line vertical + leve background tintado
// - Scroll-spy con root = #course-scroll-container (layout app-like)
//
// El sticky lo provee el <aside> padre en el layout del step page.

"use client";

import { useEffect, useRef, useState } from "react";

import type { Heading } from "@/lib/course/extract-headings";
import { t, type Locale } from "@/lib/course/i18n";
import { cn } from "@/lib/utils";

interface TOCProps {
  headings: Heading[];
  className?: string;
  locale?: Locale;
}

export function TOC({ headings, className, locale = "es" }: TOCProps) {
  const strings = t(locale);
  const [activeId, setActiveId] = useState<string | null>(
    headings[0]?.id ?? null,
  );
  // Ref para ignorar al observer mientras un smooth scroll dispara por click.
  // Sin esto, el scroll cruza por headings intermedios y el observer va
  // re-seteando active al último que pasa (en vez del clickeado).
  const isScrollingFromClick = useRef(false);
  const scrollLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const scrollRoot = document.getElementById("course-scroll-container") ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        // Si estamos en medio de un scroll por click, NO actualizamos active.
        if (isScrollingFromClick.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible.length > 0 && visible[0].target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: scrollRoot,
        rootMargin: "0px 0px -66% 0px",
        threshold: 0,
      },
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
      if (scrollLockTimer.current) clearTimeout(scrollLockTimer.current);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  // Compactar el texto de los H3 que son preguntas del cuestionario:
  //   "Pregunta 1: ¿Por qué std y no no_std?" → "1) ¿Por qué std y no no_std?"
  //   "Question 1: Why std and not no_std?"   → "1) Why std and not no_std?"
  function formatTocText(text: string): string {
    const m = text.match(/^(?:Pregunta|Question)\s+(\d+):\s*(.+)$/i);
    if (m) return `${m[1]}) ${m[2]}`;
    return text;
  }

  // Numeración H2 → 01, 02, 03… (matchea counter CSS del contenido).
  // Los H3 NO se numeran — usan un dot rust como bullet (ver render abajo).
  let h2Counter = 0;
  const h2Numbers = new Map<string, string>();
  for (const h of headings) {
    if (h.depth === 2) {
      h2Counter++;
      h2Numbers.set(h.id, String(h2Counter).padStart(2, "0"));
    }
  }

  // Click handler: scroll al heading. `scrollIntoView` resuelve solo el
  // scroll container correcto. Activamos un lock temporal que ignora al
  // observer durante el smooth scroll — sin lock, el observer vería los
  // headings intermedios pasar y setearía active al último, no al clickeado.
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string): void {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    // Lock + active immediato
    isScrollingFromClick.current = true;
    setActiveId(id);

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);

    // Liberar el lock después de que termine el smooth scroll (~1.2s
    // cubre la mayoría de casos, incluso scrolls largos).
    if (scrollLockTimer.current) clearTimeout(scrollLockTimer.current);
    scrollLockTimer.current = setTimeout(() => {
      isScrollingFromClick.current = false;
    }, 1200);
  }

  return (
    <nav aria-label={strings.tocAriaLabel} className={cn(className)}>
      <p className="course-kicker mb-5">{strings.tocKicker}</p>
      <ol className="relative space-y-0.5">
        {/* Track vertical sutil de fondo */}
        <span
          aria-hidden
          className="absolute left-0 top-1 bottom-1 w-px bg-[color:var(--course-border)]"
        />
        {headings.map((h) => {
          const isActive = activeId === h.id;
          const isH2 = h.depth === 2;
          const isPregunta = !isH2 && /^(?:Pregunta|Question)\s+\d+:/i.test(h.text);

          return (
            <li key={h.id} className="relative">
              <a
                href={`#${h.id}`}
                onClick={(e) => handleClick(e, h.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "no-course-style relative block py-1.5 leading-snug",
                  "transition-colors duration-200",
                  // H2: prominente, sin indentación. El active suma color rust
                  // y peso bold para destacar netamente sobre los inactivos.
                  isH2 && [
                    "pl-4 pr-2 text-[13px] tracking-[-0.005em]",
                    isActive
                      ? "font-bold text-[color:var(--course-accent)]"
                      : "font-medium text-[color:var(--course-ink-soft)] hover:text-[color:var(--course-ink)]",
                  ],
                  // H3 normal: indentado básico. Preguntas del cuestionario
                  // van un punto más adentro para reforzar que son sub-items.
                  !isH2 && [
                    "pr-2 text-[12.5px]",
                    isPregunta ? "pl-10" : "pl-7",
                    isActive
                      ? "font-semibold text-[color:var(--course-accent)]"
                      : "font-normal text-[color:var(--course-ink-mute)] hover:text-[color:var(--course-ink-soft)]",
                  ],
                )}
              >
                {/* Active accent line — más alto en H2, más corto en H3 */}
                {isActive && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 w-[2px] rounded-full bg-[color:var(--course-accent)]",
                      "transition-all duration-300",
                      isH2 ? "top-1.5 bottom-1.5" : "top-2 bottom-2",
                    )}
                  />
                )}
                {/* H2: número 01, 02… en mono rust */}
                {isH2 && h2Numbers.get(h.id) && (
                  <span
                    className={cn(
                      "mr-2 inline-block font-course-mono text-[10px] font-semibold tabular-nums",
                      "transition-colors",
                      isActive
                        ? "text-[color:var(--course-accent)]"
                        : "text-[color:var(--course-ink-mute)]",
                    )}
                  >
                    {h2Numbers.get(h.id)}
                  </span>
                )}
                {/* H3 normal: dot rust. Las preguntas del cuestionario usan
                    el "1)" como marker propio, sin bullet duplicado. */}
                {!isH2 && !/^(?:Pregunta|Question)\s+\d+:/i.test(h.text) && (
                  <span
                    aria-hidden
                    className={cn(
                      "mr-2 inline-block size-1 rounded-full align-middle",
                      "transition-colors",
                      isActive
                        ? "bg-[color:var(--course-accent)]"
                        : "bg-[color:var(--course-ink-mute)]/60",
                    )}
                  />
                )}
                {isH2 ? h.text : formatTocText(h.text)}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
