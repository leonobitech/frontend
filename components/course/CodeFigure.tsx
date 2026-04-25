// ─── Rust Embedded desde Cero — Wrapper del <figure> de rehype-pretty-code ───
//
// Client component que reemplaza el <figure> nativo que emite rehype-pretty-code.
// Propaga el `data-language` del <pre> al <figure> (para CSS targeting) y
// agrega un header flotante con:
//   1. Chip del lenguaje (rust / bash / toml / json / ...)
//   2. Botón copy — lee `textContent` del <pre><code> y lo copia al clipboard
//
// Los diagramas ASCII (`lang="text"`) no muestran ni chip ni botón copy —
// copiar un diagrama de cajas Unicode no tiene utilidad.

"use client";

import { Check, Copy } from "lucide-react";
import {
  Children,
  isValidElement,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
} from "react";

import { cn } from "@/lib/utils";

type CodeFigureProps = HTMLAttributes<HTMLElement> & {
  "data-rehype-pretty-code-figure"?: string;
};

const PLAIN_TEXT_LANGS = new Set(["text", "plaintext", "plain"]);

export function CodeFigure({ children, ...props }: CodeFigureProps) {
  const figureRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  // Extraer el data-language del <pre> hijo (rehype-pretty-code lo pone ahí)
  let lang: string | undefined;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<Record<string, unknown>>;
    if (
      typeof el.type === "string" &&
      el.type === "pre" &&
      typeof el.props["data-language"] === "string"
    ) {
      lang = el.props["data-language"] as string;
    }
  });

  const isPlain = !lang || PLAIN_TEXT_LANGS.has(lang);

  async function handleCopy(): Promise<void> {
    const code = figureRef.current?.querySelector("pre code")?.textContent ?? "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API puede fallar en contextos inseguros o sin permisos
      // — fallback silencioso, el user puede seleccionar + copiar a mano.
    }
  }

  return (
    <figure ref={figureRef} {...props} data-language={lang}>
      {/* Botón copy en top-right. Sin chip de lenguaje — la sintaxis
          highlighteada ya da pista visual del idioma. */}
      {!isPlain && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copiado" : "Copiar código"}
          className={cn(
            "absolute right-3 top-3 z-10",
            "grid size-7 place-items-center rounded",
            "border border-[color:var(--course-border)]",
            "bg-[color:var(--course-surface-raised)]",
            "text-[color:var(--course-ink-mute)]",
            "transition-colors",
            "hover:border-[color:var(--course-accent)]/40",
            "hover:text-[color:var(--course-accent)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--course-accent)]/40",
          )}
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden strokeWidth={2.5} />
          ) : (
            <Copy className="size-3.5" aria-hidden strokeWidth={2} />
          )}
        </button>
      )}
      {children}
    </figure>
  );
}
