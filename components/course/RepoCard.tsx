// ─── Rust Embedded — RepoCard ───
//
// Card discreta que linkea al repo de GitHub del paso actual. Va entre el
// título del step y el contenido MDX.
//
// Decisiones de diseño:
//   • Icon "stamp" en cuadrado con borde — visual anchor con peso suficiente
//     para que el hover scale del icono adentro se lea claramente. El cuadrado
//     cambia color/fondo, el icono crece. Dos transiciones, un efecto.
//   • La "/" entre owner y repo va en color accent (rust) al 70 %. Detalle
//     editorial — el path tiene una ligadura tipográfica que pulse incluso
//     en reposo, sin gritar.
//   • CSS-only — Tailwind transitions a 300ms ease-out. Cero overhead.
//   • Mobile: el CTA text se oculta < sm, solo queda el icono y la flecha.

import { ArrowUpRight, Github } from "lucide-react";

import { cn } from "@/lib/utils";

interface RepoCardProps {
  /** URL completa del repo en GitHub. El slug owner/repo se extrae automáticamente. */
  repoUrl: string;
  /** Kicker localizado, e.g. "Código del paso" / "Step source code". */
  label: string;
  /** CTA localizado, e.g. "Ver en GitHub" / "View on GitHub". Oculto en mobile. */
  cta: string;
  className?: string;
}

function extractRepoSlug(url: string): string {
  try {
    return new URL(url).pathname
      .replace(/^\//, "")
      .replace(/\.git$/, "")
      .replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function RepoCard({ repoUrl, label, cta, className }: RepoCardProps) {
  const slug = extractRepoSlug(repoUrl);
  const [owner, repo] = slug.includes("/")
    ? (slug.split("/", 2) as [string, string])
    : ["", slug];

  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}: ${slug} — ${cta}`}
      className={cn(
        "no-course-style group relative",
        "flex items-center gap-4",
        "rounded-lg border border-[color:var(--course-border)]",
        "bg-[color:var(--course-surface)]/60",
        "px-4 py-3.5 sm:px-5 sm:py-4",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-[1px]",
        "hover:border-[color:var(--course-accent)]/40",
        "hover:bg-[color:var(--course-surface)]",
        "hover:shadow-[0_8px_24px_-12px_rgba(232,115,78,0.25)]",
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--course-accent)]/40",
        className,
      )}
    >
      {/* Icon stamp — el cuadrado cambia color/fondo, el icono adentro crece. */}
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-md",
          "border border-[color:var(--course-border-strong)]",
          "bg-[color:var(--course-bg)]",
          "transition-colors duration-300 ease-out",
          "group-hover:border-[color:var(--course-accent)]/50",
          "group-hover:bg-[color:var(--course-accent-soft)]",
        )}
      >
        <Github
          className={cn(
            "size-5 text-[color:var(--course-ink-soft)]",
            "transition-all duration-300 ease-out",
            "group-hover:scale-110",
            "group-hover:text-[color:var(--course-accent)]",
          )}
          aria-hidden
          strokeWidth={1.75}
        />
      </div>

      {/* Label + owner/repo. La "/" en color accent es el detalle editorial. */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "course-kicker mb-1",
            "text-[color:var(--course-ink-mute)]",
            "transition-colors duration-300",
            "group-hover:text-[color:var(--course-accent)]",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "truncate font-course-mono text-[13px] tracking-[-0.01em]",
            "text-[color:var(--course-ink)]",
          )}
          title={slug}
        >
          {owner && (
            <>
              <span className="text-[color:var(--course-ink-soft)]">
                {owner}
              </span>
              <span
                aria-hidden
                className={cn(
                  "mx-[2px] text-[color:var(--course-accent)]/70",
                  "transition-colors duration-300",
                  "group-hover:text-[color:var(--course-accent)]",
                )}
              >
                /
              </span>
            </>
          )}
          <span className="font-medium">{repo}</span>
        </p>
      </div>

      {/* CTA — texto oculto en mobile, flecha siempre. Diagonal nudge clásico. */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5",
          "font-course-mono text-[11px] font-semibold uppercase tracking-wider",
          "text-[color:var(--course-ink-mute)]",
          "transition-colors duration-300",
          "group-hover:text-[color:var(--course-accent)]",
        )}
      >
        <span className="hidden sm:inline">{cta}</span>
        <ArrowUpRight
          className={cn(
            "size-4 transition-transform duration-300 ease-out",
            "group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
          )}
          aria-hidden
          strokeWidth={2}
        />
      </div>
    </a>
  );
}
