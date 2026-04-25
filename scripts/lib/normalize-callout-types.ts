// ─── Normalizar tipos de callouts a info / warning ───
//
// Manual editorial (§3): solo 2 tipos permitidos: `info` (default) y `warning`.
// Los 8 colores de Notion (red/yellow/blue/green/gray/purple/orange/default) se
// mapean según semántica. También removemos el atributo `icon=...` con emojis
// (los iconos se renderizan via lucide en el componente Callout).
//
// Mapeo:
//   red, orange, yellow                          → warning
//   blue, green, purple, gray, default           → info (default = sin atributo)
//
// Idempotente.

type CalloutType = "info" | "warning";

const COLOR_TO_TYPE: Record<string, CalloutType> = {
  red: "warning",
  orange: "warning",
  yellow: "warning",
  blue: "info",
  green: "info",
  purple: "info",
  gray: "info",
  default: "info",
};

const ATTR_RE = /(\w+)=(?:"([^"]*)"|'([^']*)')/g;

interface ParsedAttrs {
  type?: CalloutType;
  rest: string[];
}

function parseAttrs(attrString: string): ParsedAttrs {
  const result: ParsedAttrs = { rest: [] };
  for (const m of attrString.matchAll(ATTR_RE)) {
    const name = m[1];
    const value = m[2] ?? m[3] ?? "";
    if (name === "color") {
      const t = COLOR_TO_TYPE[value] ?? "info";
      if (t !== "info") result.type = t; // info se omite (es default)
    } else if (name === "type") {
      // Si ya viene con type, respetar pero normalizar a info/warning
      const t = (value === "warning" ? "warning" : "info") as CalloutType;
      if (t !== "info") result.type = t;
    } else if (name === "icon") {
      // descartar — los iconos vienen del componente lucide, no del MDX
    } else {
      // attrs no reconocidos se preservan tal cual
      result.rest.push(`${name}="${value}"`);
    }
  }
  return result;
}

/**
 * Normaliza `<Callout color="X" icon="emoji">` a `<Callout type="warning">` o
 * `<Callout>` (default info). Atributos no reconocidos se preservan.
 *
 * También repara el bug histórico `<Callouttype="...">` (sin espacio entre
 * `Callout` y `type`) que generó una versión previa del normalizer.
 */
export function normalizeCalloutTypes(text: string): string {
  // Captura tanto `<Callout ...>` con espacio como `<Calloutattr=...>` sin
  // espacio (legacy). El `(?=\W)` garantiza que el siguiente char NO es
  // letra/dígito (evita matchear hipotético `<CalloutFoo>`).
  return text.replace(
    /<Callout(?=\s|[a-z][a-z]*=)([^>]*)>/gi,
    (_, attrsRaw: string) => {
      if (!attrsRaw.trim()) return "<Callout>";
      const parsed = parseAttrs(attrsRaw);
      const parts: string[] = [];
      if (parsed.type) parts.push(`type="${parsed.type}"`);
      parts.push(...parsed.rest);
      const attrs = parts.length ? " " + parts.join(" ") : "";
      return `<Callout${attrs}>`;
    },
  );
}
