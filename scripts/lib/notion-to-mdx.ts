// ─── Rust Embedded desde Cero — Converter Notion blocks → MDX ───
//
// Módulo puro (sin fetches Notion) — recibe blocks ya traídos del API y devuelve
// el cuerpo MDX + la bonus question extraída. Separado del entry point para que
// sea testeable (futuro) y para aislar el dispatcher por tipo de block.
//
// Tipos de block soportados:
//   paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, toggle,
//   code, quote, callout, divider, image, bookmark, table
//
// Tipos intencionalmente NO soportados (el curso no los usa, o requieren
// contexto especial):
//   child_page, child_database, column_list, column, embed, equation, pdf,
//   video, file, synced_block, breadcrumb, template, to_do
//
// Los no soportados caen al default branch y se inyectan como HTML comment
// visible en el MDX (<!-- Unsupported Notion block: X -->) para debugging.

import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { notionColorToBrand } from "./notion-color";

/** Block extendido con children expandidos (Notion API solo trae 1 nivel). */
export type ExtendedBlock = BlockObjectResponse & {
  children?: ExtendedBlock[];
};

export interface BonusQuestionPartial {
  /** El enunciado de la pregunta BONUS. */
  prompt: string;
  /** La respuesta "correcta" en formato libre (para el explanation). */
  correct: string;
  /** Explicación extendida — por lo general == correct. */
  explanation: string;
}

// ─── Entry point del converter ───

export function convertBlocksToMdx(blocks: BlockObjectResponse[]): {
  mdxBody: string;
  bonusQuestion: BonusQuestionPartial | null;
} {
  const extended = blocks as ExtendedBlock[];
  const bonusQuestion = extractBonusQuestionFromBlocks(extended);
  // La BONUS se mueve al frontmatter — la filtramos del body para no duplicar
  const filtered = filterOutBonus(extended);

  const lines: string[] = [];
  convertBlockListToMdx(filtered, lines, 0);

  // Normalizar: collapsar 3+ newlines consecutivos a 2 (un párrafo vacío)
  const body = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { mdxBody: body, bonusQuestion };
}

// ─── Dispatcher ───

function convertBlockListToMdx(
  blocks: ExtendedBlock[],
  out: string[],
  indent: number,
): void {
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    // Agrupar list items consecutivos del mismo tipo para render coherente
    if (b.type === "bulleted_list_item" || b.type === "numbered_list_item") {
      const listType = b.type;
      const ordered = listType === "numbered_list_item";
      const group: ExtendedBlock[] = [];
      while (i < blocks.length && blocks[i].type === listType) {
        group.push(blocks[i]);
        i++;
      }
      renderList(group, ordered, out, indent);
    } else {
      renderBlock(b, out, indent);
      i++;
    }
  }
}

function renderBlock(
  block: ExtendedBlock,
  out: string[],
  indent: number,
): void {
  const pad = "  ".repeat(indent);

  switch (block.type) {
    case "paragraph": {
      const text = richTextToMarkdown(block.paragraph.rich_text);
      if (text.trim()) {
        out.push(`${pad}${text}`);
        out.push("");
      }
      break;
    }
    case "heading_1": {
      const text = richTextToMarkdown(block.heading_1.rich_text);
      out.push(`${pad}# ${text}`);
      out.push("");
      break;
    }
    case "heading_2": {
      const text = richTextToMarkdown(block.heading_2.rich_text);
      out.push(`${pad}## ${text}`);
      out.push("");
      break;
    }
    case "heading_3": {
      const text = richTextToMarkdown(block.heading_3.rich_text);
      out.push(`${pad}### ${text}`);
      out.push("");
      break;
    }
    case "code": {
      const text = block.code.rich_text.map((rt) => rt.plain_text).join("");
      const lang = block.code.language || "";
      out.push(`${pad}\`\`\`${lang}`);
      for (const line of text.split("\n")) {
        out.push(`${pad}${line}`);
      }
      out.push(`${pad}\`\`\``);
      out.push("");
      break;
    }
    case "callout": {
      renderCallout(block, out, indent);
      break;
    }
    case "toggle": {
      renderToggle(block, out, indent);
      break;
    }
    case "divider": {
      out.push(`${pad}---`);
      out.push("");
      break;
    }
    case "quote": {
      const text = richTextToMarkdown(block.quote.rich_text);
      for (const line of text.split("\n")) {
        out.push(`${pad}> ${line}`);
      }
      out.push("");
      break;
    }
    case "image": {
      const src =
        block.image.type === "external"
          ? block.image.external.url
          : block.image.file.url;
      const caption = block.image.caption
        .map((rt) => rt.plain_text)
        .join("")
        .trim();
      const alt = caption || "Imagen";
      out.push(`${pad}![${alt}](${src})`);
      if (caption) {
        out.push("");
        out.push(`${pad}*${caption}*`);
      }
      out.push("");
      break;
    }
    case "table": {
      renderTable(block, out, indent);
      break;
    }
    case "bookmark": {
      const url = block.bookmark.url;
      const caption = block.bookmark.caption
        .map((rt) => rt.plain_text)
        .join("")
        .trim();
      out.push(`${pad}[${caption || url}](${url})`);
      out.push("");
      break;
    }
    default: {
      // Unsupported — inyectar comment para debugging y no perder señal
      out.push(`${pad}<!-- Unsupported Notion block: ${block.type} -->`);
      out.push("");
    }
  }
}

// ─── Renderers específicos ───

function renderCallout(block: ExtendedBlock, out: string[], indent: number): void {
  if (block.type !== "callout") return;
  const pad = "  ".repeat(indent);

  const icon = extractEmojiIcon(block.callout.icon);
  const color = notionColorToBrand(block.callout.color);
  const content = richTextToMarkdown(block.callout.rich_text);

  const iconProp = icon ? ` icon="${icon}"` : "";
  const colorProp = color !== "default" ? ` color="${color}"` : "";

  // Abrir tag JSX
  out.push(`${pad}<Callout${iconProp}${colorProp}>`);

  // Contenido inline (rich_text del callout propio)
  if (content.trim()) {
    out.push(`${pad}  ${content}`);
  }

  // Children (sub-bloques del callout — MDX los procesa como markdown)
  if (block.children?.length) {
    out.push("");
    const nested: string[] = [];
    convertBlockListToMdx(block.children, nested, 0);
    for (const line of nested) {
      out.push(`${pad}  ${line}`);
    }
  }

  out.push(`${pad}</Callout>`);
  out.push("");
}

function renderToggle(block: ExtendedBlock, out: string[], indent: number): void {
  if (block.type !== "toggle") return;
  const pad = "  ".repeat(indent);

  const summary = richTextToMarkdown(block.toggle.rich_text);

  out.push(`${pad}<details>`);
  out.push(`${pad}  <summary>${summary}</summary>`);
  if (block.children?.length) {
    out.push("");
    const nested: string[] = [];
    convertBlockListToMdx(block.children, nested, 0);
    for (const line of nested) {
      out.push(`${pad}  ${line}`);
    }
  }
  out.push(`${pad}</details>`);
  out.push("");
}

function renderList(
  items: ExtendedBlock[],
  ordered: boolean,
  out: string[],
  indent: number,
): void {
  const pad = "  ".repeat(indent);

  items.forEach((item, idx) => {
    const marker = ordered ? `${idx + 1}.` : "-";
    const richText =
      item.type === "bulleted_list_item"
        ? item.bulleted_list_item.rich_text
        : item.type === "numbered_list_item"
          ? item.numbered_list_item.rich_text
          : [];
    const text = richTextToMarkdown(richText);
    out.push(`${pad}${marker} ${text}`);

    if (item.children?.length) {
      const nested: string[] = [];
      convertBlockListToMdx(item.children, nested, 0);
      for (const line of nested) {
        // Indent nested a 2 espacios más (convención markdown)
        if (line.trim()) out.push(`${pad}  ${line}`);
      }
    }
  });
  out.push("");
}

function renderTable(block: ExtendedBlock, out: string[], indent: number): void {
  const pad = "  ".repeat(indent);
  if (!block.children?.length) return;

  const rows = block.children.filter(
    (c): c is ExtendedBlock & { type: "table_row" } => c.type === "table_row",
  );
  if (rows.length === 0) return;

  const headerRow = rows[0];
  const headerCells = headerRow.table_row.cells.map((cell) =>
    richTextToMarkdown(cell),
  );
  out.push(`${pad}| ${headerCells.join(" | ")} |`);
  out.push(`${pad}| ${headerCells.map(() => "---").join(" | ")} |`);

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].table_row.cells.map((cell) =>
      richTextToMarkdown(cell),
    );
    out.push(`${pad}| ${cells.join(" | ")} |`);
  }
  out.push("");
}

// ─── Rich text (inline) → markdown ───

export function richTextToMarkdown(
  richText: readonly RichTextItemResponse[],
): string {
  return richText.map(richTextItemToMarkdown).join("");
}

function richTextItemToMarkdown(rt: RichTextItemResponse): string {
  let text = rt.plain_text;
  const { annotations, href } = rt;

  // Orden de aplicación: primero code (que escapa el resto),
  // después bold/italic/strike, al final link
  if (annotations.code) {
    text = `\`${text}\``;
  } else {
    if (annotations.bold) text = `**${text}**`;
    if (annotations.italic) text = `*${text}*`;
    if (annotations.strikethrough) text = `~~${text}~~`;
  }

  if (href) {
    text = `[${text}](${href})`;
  }
  return text;
}

// ─── Icon extraction ───

// Notion icon puede ser emoji, external (URL) o file (URL interna).
// Solo extraemos emojis — el curso usa emojis al 100%.
function extractEmojiIcon(
  icon: { type: string; emoji?: string } | null,
): string | null {
  if (!icon) return null;
  if (icon.type === "emoji" && typeof icon.emoji === "string") {
    return icon.emoji;
  }
  return null;
}

// ─── BONUS question extraction ───

/**
 * Busca en los blocks la pregunta BONUS del cuestionario. Convención del brain:
 *   ### Pregunta BONUS: ...prompt...
 *   <details>
 *     <summary>Ver respuesta</summary>
 *     ...respuesta...
 *   </details>
 *
 * En Notion esto se representa como heading_3 + toggle siguiente.
 * Devuelve null si no encuentra el patrón — el overrides.yaml completa manualmente.
 */
export function extractBonusQuestionFromBlocks(
  blocks: ExtendedBlock[],
): BonusQuestionPartial | null {
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type !== "heading_3") continue;
    const title = richTextToMarkdown(b.heading_3.rich_text);
    if (!/bonus/i.test(title)) continue;

    // Extract prompt: "Pregunta BONUS: ¿...?" → "¿...?"
    const promptMatch = title.match(/bonus:?\s*(.+)$/i);
    const prompt = promptMatch ? promptMatch[1].trim() : title;

    // El toggle siguiente tiene la respuesta
    const nextBlock = blocks[i + 1];
    if (nextBlock?.type !== "toggle" || !nextBlock.children?.length) {
      return { prompt, correct: "(TODO: respuesta no encontrada)", explanation: "" };
    }

    const answerText = nextBlock.children
      .filter((c): c is ExtendedBlock & { type: "paragraph" } =>
        c.type === "paragraph",
      )
      .map((c) => richTextToMarkdown(c.paragraph.rich_text))
      .join("\n\n")
      .trim();

    if (!answerText) {
      return { prompt, correct: "(TODO: respuesta vacía)", explanation: "" };
    }

    // `correct` es la primera oración/párrafo — más conciso para mostrar como opción
    // `explanation` es la respuesta completa
    const firstSentence = answerText.split(/\n\n|\.\s+/)[0];
    return {
      prompt,
      correct: firstSentence,
      explanation: answerText,
    };
  }
  return null;
}

/** Filtra del body los blocks de la BONUS (heading_3 + toggle que siguen). */
export function filterOutBonus(blocks: ExtendedBlock[]): ExtendedBlock[] {
  const result: ExtendedBlock[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "heading_3") {
      const title = richTextToMarkdown(b.heading_3.rich_text);
      if (/pregunta\s+bonus/i.test(title)) {
        // Skip este heading + el toggle siguiente
        if (blocks[i + 1]?.type === "toggle") i++;
        continue;
      }
    }
    result.push(b);
  }
  return result;
}
