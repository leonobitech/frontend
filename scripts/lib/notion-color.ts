// ─── Rust Embedded desde Cero — Mapeo Notion color → brand color ───
//
// Notion expone estos colores para blocks (callout, toggle, párrafo con color):
//   default, gray, brown, orange, yellow, green, blue, purple, pink, red
// y variantes `*_background` para el bg. Nuestro brand tiene 7 colores + default:
//   red, yellow, blue, green, gray, purple, orange, default
//
// Brown y pink de Notion no tienen equivalente 1:1 — los mapeamos a gray y
// purple respectivamente. Los foreground colors ("red" sin _background) los
// tratamos igual que el background para simplicidad.

export type BrandColor =
  | "default"
  | "red"
  | "yellow"
  | "blue"
  | "green"
  | "gray"
  | "purple"
  | "orange";

export function notionColorToBrand(notionColor: string): BrandColor {
  // Strip `_background` suffix si lo tiene
  const base = notionColor.replace(/_background$/, "");
  switch (base) {
    case "red":
      return "red";
    case "yellow":
      return "yellow";
    case "blue":
      return "blue";
    case "green":
      return "green";
    case "gray":
    case "brown":
      return "gray";
    case "purple":
    case "pink":
      return "purple";
    case "orange":
      return "orange";
    case "default":
    default:
      return "default";
  }
}
