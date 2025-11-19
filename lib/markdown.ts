import fs from "fs";
import path from "path";
import matter from "gray-matter";

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

    // Return raw markdown - react-markdown will process it
    return {
      content: markdownContent,
      metadata,
    };
  } catch (error) {
    console.error(`[Markdown] Error reading file ${filePath}:`, error);
    return null;
  }
}
