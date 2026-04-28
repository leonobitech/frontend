// ─── Rust Embedded desde Cero — Botón flotante "volver arriba" ───
//
// Client component. Aparece con fade + scale cuando el usuario scrolleó más
// de `threshold` pixels desde el top. Click → scroll smooth hasta el top.
// Respeta `prefers-reduced-motion` para desactivar la animación smooth.

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { useCourseConfig } from "@/lib/course-config/context";
import type { Locale } from "@/lib/course-config/types";
import { cn } from "@/lib/utils";

interface ScrollToTopProps {
  /** Pixels desde el top a partir de los que aparece el botón. Default 400. */
  threshold?: number;
  /**
   * ID del elemento que hace el scroll. Si se provee, el botón listenea y
   * scrollea ese elemento (app-like layout). Si no, usa `window` (default
   * para la landing del curso y otros pages con scroll del body).
   */
  scrollContainerId?: string;
  className?: string;
  locale?: Locale;
}

export function ScrollToTop({
  threshold = 400,
  scrollContainerId,
  className,
  locale = "es",
}: ScrollToTopProps) {
  const { t } = useCourseConfig();
  const strings = t(locale);
  const [visible, setVisible] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const target = scrollContainerId
      ? document.getElementById(scrollContainerId)
      : null;
    const scroller: HTMLElement | Window = target ?? window;

    function onScroll() {
      const y = target ? target.scrollTop : window.scrollY;
      setVisible(y > threshold);
    }
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [threshold, scrollContainerId]);

  function handleClick(): void {
    const target = scrollContainerId
      ? document.getElementById(scrollContainerId)
      : null;
    const behavior: ScrollBehavior = prefersReduced ? "auto" : "smooth";
    if (target) {
      target.scrollTo({ top: 0, behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={handleClick}
          aria-label={strings.scrollTopAria}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            // En mobile el SkeuoTabBar (fixed bottom, ~64px de alto) tapa el
            // botón si lo dejamos a bottom-6. Subimos a bottom-20 para que
            // quede unos ~16px arriba de la TabBar. En sm+ no hay TabBar
            // visible y volvemos al offset original.
            "fixed bottom-20 right-6 z-50",
            "grid size-12 place-items-center rounded-full",
            "border border-[color:var(--course-border-strong)]",
            "bg-[color:var(--course-surface-raised)]/90 backdrop-blur-md",
            "text-[color:var(--course-ink)]",
            "shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)]",
            "transition-colors",
            "hover:border-[color:var(--course-accent)]/50",
            "hover:text-[color:var(--course-accent)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--course-accent)]/40",
            "sm:bottom-8 sm:right-8",
            className,
          )}
        >
          <ArrowUp className="size-5" aria-hidden strokeWidth={2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
