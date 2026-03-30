"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function BlogContent({ content }: { content: string }) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-[#E91E63] prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-[#f59e0b] prose-blockquote:bg-[#f5e6d3]/10 prose-blockquote:dark:bg-[#f5e6d3]/5 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:not-italic prose-blockquote:text-muted-foreground prose-li:text-muted-foreground prose-code:text-[#E91E63] prose-code:bg-[#3A3A3A]/30 prose-code:dark:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
