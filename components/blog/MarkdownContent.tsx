"use client";

import { useEffect } from "react";
import Prism from "prismjs";

// Import Prism themes and languages
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-toml";
import "prismjs/components/prism-yaml";

interface MarkdownContentProps {
  html: string;
}

export function MarkdownContent({ html }: MarkdownContentProps) {
  useEffect(() => {
    // Highlight code blocks after component mounts
    Prism.highlightAll();
  }, [html]);

  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-12
        prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-10 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-2
        prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8
        prose-p:text-base prose-p:leading-relaxed prose-p:mb-4
        prose-a:text-purple-500 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
        prose-strong:text-foreground prose-strong:font-semibold
        prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5
        prose-code:font-mono prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
        prose-pre:bg-[#2d2d2d] prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl prose-pre:p-4
        prose-pre:overflow-x-auto prose-pre:my-6
        prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-muted/50
        prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:italic
        prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4
        prose-li:my-2
        prose-table:border-collapse prose-table:w-full prose-table:my-6
        prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-3 prose-th:font-semibold
        prose-td:border prose-td:border-border prose-td:p-3
        prose-img:rounded-xl prose-img:my-8 prose-img:shadow-lg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
