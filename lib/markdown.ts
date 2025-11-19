import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

export interface MarkdownContent {
  content: string;
  metadata?: Record<string, unknown>;
}

export async function getMarkdownContent(
  filePath: string
): Promise<MarkdownContent | null> {
  try {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

    // Construct full path from project root
    const fullPath = path.join(process.cwd(), cleanPath);

    console.log("[Markdown] Reading file:", fullPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error("[Markdown] File not found:", fullPath);
      return null;
    }

    // Read file synchronously (we're in a server component)
    const fileContent = fs.readFileSync(fullPath, "utf-8");

    // Parse frontmatter if exists
    const { data: metadata, content: markdownContent } = matter(fileContent);

    console.log(
      "[Markdown] Successfully loaded file, length:",
      markdownContent.length
    );

    // Convert markdown to HTML
    const processedContent = await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false })
      .process(markdownContent);

    const htmlContent = processedContent.toString();

    console.log("[Markdown] Converted to HTML, length:", htmlContent.length);

    return {
      content: htmlContent,
      metadata,
    };
  } catch (error) {
    console.error(`[Markdown] Error reading file ${filePath}:`, error);
    return null;
  }
}
